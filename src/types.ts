export interface Friend {
  id: string;
  name: string;
  balance: number; // positive = they owe me (+I'll Get), negative = I owe them (-I Owe)
  lastUpdate: string; // ISO string
  lastActivityText: string;
  phone?: string;
  avatarUrl?: string; // or initials if not present
}

export interface Transaction {
  id: string;
  friendId?: string; // if linked to a friend, otherwise general cashbook personal spend/income
  type: 'gave' | 'got'; // "gave" = money lent/cash outflow (red), "got" = money borrowed/cash inflow (green)
  amount: number;
  category: string; // e.g. "Lunch", "Coffee", "Travel", "Rent", "Salary", "Gift", "Shared Expense"
  note: string;
  date: string; // ISO string
  paymentMode: 'Cash' | 'Online' | 'Credit';
  photoUrl?: string;
  isSplit?: boolean; // if split equally with friends
  splitDetails?: {
    splitWith: string[]; // friend IDs
    originalAmount: number;
    shares: { [friendId: string]: number };
  };
}

export interface UserStats {
  totalGive: number;  // total I give to people (sum of absolute negative balances)
  totalGet: number;  // total I'll get from people (sum of positive balances)
}

export interface CashbookItem {
  id: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  category: string;
  note: string;
  date: string;
  paymentMode: 'Cash' | 'Online' | 'Credit';
}

export type ActiveTab = 'friends' | 'cashbook' | 'insights' | 'settings';
