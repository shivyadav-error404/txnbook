# Security Specification & Threat Model

This document outlines the zero-trust data access policy for Personal Ledger (myKhata).

## 1. Data Invariants
- Each user can only read, create, update, or delete their own user profile, friends subcollection, and transactions subcollection.
- During document creation, a user cannot write other people's data or modify other user's records.
- Balances and timestamps are validated. No phantom fields are allowed on creation due to precise `.keys().size()` checks.
- Fields representing historic state (`createdAt`, `ownerId`) are immutable.
- A friend cannot have an ID that exceeds length bounds or contains bad character patterns (`isValidId` check).

## 2. Threat Scenarios ("The Dirty Dozen" Payloads)
Below are 12 malicious payloads designed to bypass client validation, demonstrating how the security rules block them.

1. **Self-Elevated profile balances (Resource Spoofing)**: Trying to write arbitrary values to `totalOwe` on user profile.
2. **Identity Spoofing on Friend Create**: Creating a friend document where `ownerId` is another user's UID to read or edit their ledger.
3. **Transaction Hijacking**: Writing a transaction into another user's subcollection.
4. **Id Poisoning (Denial of Wallet)**: Injecting a 2MB hex string as a friend's ID to exhaust database resources or corrupt queries.
5. **Phantom Field Injection**: Creating a Friend with a secret helper key like `isAdmin: true` to bypass administrative logs.
6. **Negative Value Creation**: Creating a transaction with a negative amount like `-₹50,000` to manipulate summaries.
7. **Temporal Fraud**: Setting `createdAt` of a Transaction to a future date instead of the server timestamp.
8. **Owner Overwrite**: Modifying the immutable `ownerId` of an existing transaction to gain ownership.
9. **Blanket Query Scrape**: Standard list request with no specific filter by owner, attempting to fetch other clients' transactions.
10. **State short-circuit**: Forcing transaction `type` to an invalid enum string like `"stolen"`.
11. **Bypassing Category constraints**: Injecting a massive string as a category tag.
12. **Anonymous Overwrites**: Trying to write data without an active Firebase Auth user token.

## 3. Threat Rule Design (DRAFT_firestore.rules)
To mitigate these, we will build standard Firebase rules verifying auth state using secure path matching:
`match /users/{userId}` allows reads and writes ONLY if `request.auth.uid == userId`.
`match /users/{userId}/friends/{friendId}` and `match /users/{userId}/transactions/{transactionId}` similarly inherit safety because they are subcollections under the `/users/{userId}` path, which requires `request.auth.uid == userId` for any operation.
This hierarchical sandboxing is highly performant and forms the "Master Gate".
