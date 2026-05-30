import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, writeBatch, onSnapshot, getDocs } from 'firebase/firestore';
import { isFirebaseConfigured, db, auth, handleFirestoreError, OperationType } from './lib/firebase';

import { Friend, Transaction, CashbookItem, ActiveTab } from './types';
import { INITIAL_FRIENDS, INITIAL_TRANSACTIONS } from './data/initialData';

// Component Imports
import Dashboard from './components/Dashboard';
import FriendHistory from './components/FriendHistory';
import CashbookInsights from './components/CashbookInsights';
import AddTransaction from './components/AddTransaction';
import SplitBillModal from './components/SplitBillModal';
import MonthlySummaryModal from './components/MonthlySummaryModal';
import Settings from './components/Settings';
import EditFriendModal from './components/EditFriendModal';
import EditTransactionModal from './components/EditTransactionModal';
import AIAuditWorkspace from './components/AIAuditWorkspace';

// Lucide icons
import { Users, Landmark, TrendingUp, DollarSign, Wallet, ClipboardList, Settings as SettingsIcon, QrCode } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAuditOverlay, setShowAuditOverlay] = useState(false);
  const [isAuditWindow, setIsAuditWindow] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('window') === 'audit';
  });
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeDropdownTxId, setActiveDropdownTxId] = useState<string | null>(null);

  // Authentication & Cloud Sync State
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('txnbook_simulated_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const handleUserChange = (newUser: any | null) => {
    setUser(newUser);
    if (!newUser) {
      localStorage.removeItem('txnbook_simulated_user');
    } else if (newUser.uid && (newUser.uid.startsWith('mock_') || newUser.uid.startsWith('demo_'))) {
      localStorage.setItem('txnbook_simulated_user', JSON.stringify(newUser));
    }
  };

  // Core Ledger State
  const [friends, setFriends] = useState<Friend[]>(() => {
    const localF = localStorage.getItem('mykhata_friends');
    return localF ? JSON.parse(localF) : [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const localT = localStorage.getItem('mykhata_transactions');
    return localT ? JSON.parse(localT) : [];
  });

  // Currency Selection State ('₹' or '$')
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    return localStorage.getItem('txnbook_currency_symbol') || '₹';
  });

  // Dark Mode State with local storage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('txnbook_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('txnbook_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Friends filtering type ("all" | "get" | "give")
  const [friendsListFilter, setFriendsListFilter] = useState<'all' | 'get' | 'give'>('all');

  // --- 1. LOCAL STORAGE BACKUP HANDLERS ---
  const loadLocalStorageBackupState = () => {
    const localF = localStorage.getItem('mykhata_friends');
    const localT = localStorage.getItem('mykhata_transactions');
    
    if (localF && localT) {
      setFriends(JSON.parse(localF));
      setTransactions(JSON.parse(localT));
    } else {
      setFriends(INITIAL_FRIENDS);
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('mykhata_friends', JSON.stringify(INITIAL_FRIENDS));
      localStorage.setItem('mykhata_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }
  };

  const saveLocalStorageBackupState = (updatedFriends: Friend[], updatedTxs: Transaction[]) => {
    localStorage.setItem('mykhata_friends', JSON.stringify(updatedFriends));
    localStorage.setItem('mykhata_transactions', JSON.stringify(updatedTxs));
  };

  // --- 2. FIREBASE REAL-TIME DB INTEGRATION ---
  useEffect(() => {
    loadLocalStorageBackupState();

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('txnbook_simulated_user');
        setUser(firebaseUser);
        setLoading(true);
        
        // Dynamic path configuration
        const friendsPath = `users/${firebaseUser.uid}/friends`;
        const txsPath = `users/${firebaseUser.uid}/transactions`;

        // Real-time listener for user friends
        const unsubFriends = onSnapshot(collection(db, friendsPath), (snapshot) => {
          const cloudFriendsList: Friend[] = [];
          snapshot.forEach((docSnap) => {
            cloudFriendsList.push({ id: docSnap.id, ...docSnap.data() } as Friend);
          });
          
          if (cloudFriendsList.length > 0) {
            setFriends(cloudFriendsList);
            localStorage.setItem('mykhata_friends', JSON.stringify(cloudFriendsList));
          } else {
            // First time cloud user, sync local seed data instantly!
            const batch = writeBatch(db);
            INITIAL_FRIENDS.forEach(f => {
              const ref = doc(db, friendsPath, f.id);
              batch.set(ref, { ...f, ownerId: firebaseUser.uid });
            });
            batch.commit().catch(err => console.error("Error writing initial friends snapshot:", err));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, friendsPath);
        });

        // Real-time listener for user transactions
        const unsubTxs = onSnapshot(collection(db, txsPath), (snapshot) => {
          const cloudTxsList: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            cloudTxsList.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
          });
          
          if (cloudTxsList.length > 0) {
            setTransactions(cloudTxsList);
            localStorage.setItem('mykhata_transactions', JSON.stringify(cloudTxsList));
          } else {
            // Write initial txs seeds
            const batch = writeBatch(db);
            INITIAL_TRANSACTIONS.forEach(t => {
              const ref = doc(db, txsPath, t.id);
              batch.set(ref, { ...t, ownerId: firebaseUser.uid });
            });
            batch.commit().catch(err => console.error("Error writing initial transactions snapshot:", err));
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, txsPath);
        });

        return () => {
          unsubFriends();
          unsubTxs();
        };

      } else {
        const savedSimulated = localStorage.getItem('txnbook_simulated_user');
        if (savedSimulated) {
          setUser(JSON.parse(savedSimulated));
          loadLocalStorageBackupState();
          setLoading(false);
        } else {
          setUser(null);
          loadLocalStorageBackupState();
          setLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 3. MERGING & SAVING LEDGER DATA ---
  const saveStateChangesAndSync = async (newFriends: Friend[], newTxs: Transaction[]) => {
    // Update active memory
    setFriends(newFriends);
    setTransactions(newTxs);
    // Persist offline cache
    saveLocalStorageBackupState(newFriends, newTxs);

    // Sync to Cloud Firestore if signed in
    const isMockUser = user?.uid?.startsWith('mock_') || user?.uid?.startsWith('demo_');
    if (user && db && !isMockUser) {
      // Find what changed and update Firestore
      try {
        const batch = writeBatch(db);
        // Direct write changes safely
        // To be secure, let's write to user sandboxed collection path
        const friendsColRef = `users/${user.uid}/friends`;
        const txsColRef = `users/${user.uid}/transactions`;

        // Update profile summaries
        const totalI_llGet = newFriends.filter(f => f.balance > 0).reduce((sum, f) => sum + f.balance, 0);
        const totalIOwe = newFriends.filter(f => f.balance < 0).reduce((sum, f) => sum + Math.abs(f.balance), 0);
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'Default User',
          email: user.email || 'shivyadav0344@gmail.com',
          totalOwe: totalIOwe,
          totalGet: totalI_llGet,
          updatedAt: new Date().toISOString()
        }, { merge: true });

      } catch (err) {
        console.error("Cloud summaries syncing error:", err);
      }
    }
  };

  // --- 4. ACTION CONTROLLERS ---

  // Append new transaction to ledger, updating friend metrics safely
  const handleAddTransaction = async (txInput: Omit<Transaction, 'id' | 'date'>) => {
    const freshId = `tx_${Date.now()}`;
    const newTx: Transaction = {
      ...txInput,
      id: freshId,
      date: new Date().toISOString()
    };

    let updatedFriends = [...friends];
    if (newTx.friendId) {
      updatedFriends = friends.map(friend => {
        if (friend.id === newTx.friendId) {
          // Adjust balance: positive = they owe me (+I'll Get), negative = I owe them (-I Owe)
          const multiplier = newTx.type === 'gave' ? 1 : -1;
          const amtChange = newTx.amount * multiplier;
          
          return {
            ...friend,
            balance: friend.balance + amtChange,
            lastUpdate: new Date().toISOString(),
            lastActivityText: newTx.note || `${newTx.category} added`
          };
        }
        return friend;
      });
    }

    const updatedTxs = [...transactions, newTx];
    
    // Save to Database
    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    // Write individual doc to Firestore
    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await setDoc(doc(db, `${usersRef}/transactions`, newTx.id), {
          ...newTx,
          ownerId: user.uid
        });
        
        if (newTx.friendId) {
          const associatedFriend = updatedFriends.find(f => f.id === newTx.friendId);
          if (associatedFriend) {
            await setDoc(doc(db, `${usersRef}/friends`, associatedFriend.id), {
              ...associatedFriend,
              ownerId: user.uid
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${usersRef}/transactions/${newTx.id}`);
      }
    }

    // Dynamic state update for active friend view
    if (activeFriend && newTx.friendId === activeFriend.id) {
      const refreshedFriend = updatedFriends.find(f => f.id === activeFriend.id);
      if (refreshedFriend) setActiveFriend(refreshedFriend);
    }
  };

  // Delete transaction from ledger, reversing balance changes
  const handleDeleteTransaction = async (txId: string) => {
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) return;

    let updatedFriends = [...friends];
    if (targetTx.friendId) {
      updatedFriends = friends.map(friend => {
        if (friend.id === targetTx.friendId) {
          // Reverse balance changes
          const multiplier = targetTx.type === 'gave' ? -1 : 1;
          const amtChange = targetTx.amount * multiplier;
          
          return {
            ...friend,
            balance: friend.balance + amtChange,
            lastUpdate: new Date().toISOString(),
            lastActivityText: 'Transaction deleted'
          };
        }
        return friend;
      });
    }

    const updatedTxs = transactions.filter(t => t.id !== txId);
    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    // Cloud deletion
    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await deleteDoc(doc(db, `${usersRef}/transactions`, txId));
        
        if (targetTx.friendId) {
          const associatedFriend = updatedFriends.find(f => f.id === targetTx.friendId);
          if (associatedFriend) {
            await setDoc(doc(db, `${usersRef}/friends`, associatedFriend.id), {
              ...associatedFriend,
              ownerId: user.uid
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${usersRef}/transactions/${txId}`);
      }
    }

    // Refresh active friend screen properties
    if (activeFriend && targetTx.friendId === activeFriend.id) {
      const refreshedFriend = updatedFriends.find(f => f.id === activeFriend.id);
      if (refreshedFriend) {
        setActiveFriend(refreshedFriend);
      }
    }
  };

  // Modify friend name and phone details
  const handleEditFriend = async (friendId: string, name: string, phone: string) => {
    const updatedFriends = friends.map(f => {
      if (f.id === friendId) {
        return {
          ...f,
          name,
          phone: phone || undefined,
          lastUpdate: new Date().toISOString()
        };
      }
      return f;
    });

    await saveStateChangesAndSync(updatedFriends, transactions);

    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        const updated = updatedFriends.find(f => f.id === friendId);
        if (updated) {
          await setDoc(doc(db, `${usersRef}/friends`, friendId), {
            ...updated,
            ownerId: user.uid
          });
        }
      } catch (e) {
        console.error("Firebase friend update failed", e);
      }
    }

    if (activeFriend && activeFriend.id === friendId) {
      const refreshed = updatedFriends.find(f => f.id === friendId);
      if (refreshed) setActiveFriend(refreshed);
    }
  };

  // Completely delete a friend/account and its associated transactions
  const handleDeleteFriend = async (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    const updatedTxs = transactions.filter(t => t.friendId !== friendId);

    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await deleteDoc(doc(db, `${usersRef}/friends`, friendId));
        const friendTxs = transactions.filter(t => t.friendId === friendId);
        for (const tx of friendTxs) {
          await deleteDoc(doc(db, `${usersRef}/transactions`, tx.id));
        }
      } catch (e) {
        console.error("Firebase friend deletion failed", e);
      }
    }

    if (activeFriend && activeFriend.id === friendId) {
      setActiveFriend(null);
    }
  };

  // Modify transaction properties (and adjust balances of ledger friends properly)
  const handleEditTransaction = async (txId: string, updatedFields: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === txId);
    if (!oldTx) return;

    const newTx = { ...oldTx, ...updatedFields };

    const oldContribution = oldTx.friendId ? (oldTx.type === 'gave' ? oldTx.amount : -oldTx.amount) : 0;
    const newContribution = newTx.friendId ? (newTx.type === 'gave' ? newTx.amount : -newTx.amount) : 0;

    let updatedFriends = [...friends];

    // Case 1: Transaction belongs to same friend before and after
    if (oldTx.friendId && oldTx.friendId === newTx.friendId) {
      const amtChange = newContribution - oldContribution;
      updatedFriends = friends.map(f => {
        if (f.id === oldTx.friendId) {
          return {
            ...f,
            balance: f.balance + amtChange,
            lastUpdate: new Date().toISOString(),
            lastActivityText: newTx.note || `${newTx.category} updated`
          };
        }
        return f;
      });
    }
    // Case 2: Friend assignment changed
    else {
      if (oldTx.friendId) {
        // Remove contribution of old friend
        updatedFriends = updatedFriends.map(f => {
          if (f.id === oldTx.friendId) {
            return {
              ...f,
              balance: f.balance - oldContribution,
              lastUpdate: new Date().toISOString(),
              lastActivityText: 'Transaction removed'
            };
          }
          return f;
        });
      }
      if (newTx.friendId) {
        // Add contribution to new friend
        updatedFriends = updatedFriends.map(f => {
          if (f.id === newTx.friendId) {
            return {
              ...f,
              balance: f.balance + newContribution,
              lastUpdate: new Date().toISOString(),
              lastActivityText: newTx.note || `${newTx.category} updated`
            };
          }
          return f;
        });
      }
    }

    const updatedTxs = transactions.map(t => t.id === txId ? newTx : t);
    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    // Sync to Firestore
    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await setDoc(doc(db, `${usersRef}/transactions`, newTx.id), {
          ...newTx,
          ownerId: user.uid
        });
        if (oldTx.friendId) {
          const f1 = updatedFriends.find(f => f.id === oldTx.friendId);
          if (f1) await setDoc(doc(db, `${usersRef}/friends`, f1.id), { ...f1, ownerId: user.uid });
        }
        if (newTx.friendId && newTx.friendId !== oldTx.friendId) {
          const f2 = updatedFriends.find(f => f.id === newTx.friendId);
          if (f2) await setDoc(doc(db, `${usersRef}/friends`, f2.id), { ...f2, ownerId: user.uid });
        }
      } catch (e) {
        console.error("Firebase transaction edit sync failed", e);
      }
    }

    // Refresh active friend screen properties
    if (activeFriend) {
      if (activeFriend.id === oldTx.friendId || activeFriend.id === newTx.friendId) {
        const currentActiveId = activeFriend.id;
        const refreshedFriend = updatedFriends.find(f => f.id === currentActiveId);
        if (refreshedFriend) setActiveFriend(refreshedFriend);
      }
    }
  };

  // Add new friend to ledger
  const handleAddNewFriend = async (name: string, phone: string, initialBalance: number, isOwe: boolean) => {
    const friendId = `friend_${Date.now()}`;
    const startingBalance = isOwe ? -initialBalance : initialBalance;

    const newFriend: Friend = {
      id: friendId,
      name,
      phone: phone || undefined,
      balance: startingBalance,
      lastUpdate: new Date().toISOString(),
      lastActivityText: initialBalance > 0 ? 'Account Opened with initial ledger' : 'Account Opened'
    };

    const updatedFriends = [...friends, newFriend];
    let updatedTxs = [...transactions];

    // Log starting transaction for records if specified
    if (initialBalance > 0) {
      const startTx: Transaction = {
        id: `tx_init_${Date.now()}`,
        friendId,
        type: isOwe ? 'got' : 'gave',
        amount: initialBalance,
        category: 'Shared Expense',
        note: `Account setup initial balance`,
        date: new Date().toISOString(),
        paymentMode: 'Cash'
      };
      updatedTxs.push(startTx);
    }

    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await setDoc(doc(db, `${usersRef}/friends`, newFriend.id), {
          ...newFriend,
          ownerId: user.uid
        });

        if (initialBalance > 0) {
          const addedTx = updatedTxs[updatedTxs.length - 1];
          await setDoc(doc(db, `${usersRef}/transactions`, addedTx.id), {
            ...addedTx,
            ownerId: user.uid
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${usersRef}/friends/${newFriend.id}`);
      }
    }
  };

  // Complete Settlement - zeros out balance for active friend
  const handleSettleFullFriendBalance = async () => {
    if (!activeFriend || activeFriend.balance === 0) return;

    // Create a countering offsetting transaction of settlement type
    const settlementAmount = Math.abs(activeFriend.balance);
    const counterbalancingType = activeFriend.balance > 0 ? 'got' : 'gave'; // they pay me = got, I pay them = gave

    const setTx: Transaction = {
      id: `tx_settle_${Date.now()}`,
      friendId: activeFriend.id,
      type: counterbalancingType,
      amount: settlementAmount,
      category: 'Shared Expense',
      note: 'Account ledger fully settled',
      date: new Date().toISOString(),
      paymentMode: 'Cash'
    };

    const updatedFriends = friends.map(f => {
      if (f.id === activeFriend.id) {
        return {
          ...f,
          balance: 0,
          lastUpdate: new Date().toISOString(),
          lastActivityText: 'Cleared and Settled'
        };
      }
      return f;
    });

    const updatedTxs = [...transactions, setTx];
    await saveStateChangesAndSync(updatedFriends, updatedTxs);

    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        await setDoc(doc(db, `${usersRef}/transactions`, setTx.id), {
          ...setTx,
          ownerId: user.uid
        });
        
        await setDoc(doc(db, `${usersRef}/friends`, activeFriend.id), {
          id: activeFriend.id,
          name: activeFriend.name,
          balance: 0,
          lastUpdate: new Date().toISOString(),
          lastActivityText: 'Cleared and Settled',
          phone: activeFriend.phone || '',
          avatarUrl: activeFriend.avatarUrl || '',
          ownerId: user.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${usersRef}/transactions/${setTx.id}`);
      }
    }

    // Refresh visual active friend
    const freshSelf = updatedFriends.find(f => f.id === activeFriend.id);
    if (freshSelf) setActiveFriend(freshSelf);
  };

  // Split calculations
  const handleSplitBillSubmit = async (totalAmount: number, desc: string, selectFriendIds: string[]) => {
    // Total divisions including developer/me
    const dividand = selectFriendIds.length + 1;
    const individualShare = totalAmount / dividand;

    let updatedFriends = [...friends];
    const newTxs: Transaction[] = [];

    // Each selected friend gets split transaction with type: gave (they owe me)
    selectFriendIds.forEach((fId, idx) => {
      const freshTxId = `tx_split_${Date.now()}_${idx}`;
      
      const tx: Transaction = {
        id: freshTxId,
        friendId: fId,
        type: 'gave', // They owe me their share
        amount: parseFloat(individualShare.toFixed(2)),
        category: 'Shared Expense',
        note: `Split: ${desc}`,
        date: new Date().toISOString(),
        paymentMode: 'Online',
        isSplit: true
      };

      newTxs.push(tx);

      // Adjust friends balances list
      updatedFriends = updatedFriends.map(f => {
        if (f.id === fId) {
          return {
            ...f,
            balance: f.balance + tx.amount,
            lastUpdate: new Date().toISOString(),
            lastActivityText: `Split: ${desc}`
          };
        }
        return f;
      });
    });

    const finalTxsList = [...transactions, ...newTxs];
    await saveStateChangesAndSync(updatedFriends, finalTxsList);

    // Save batch to Cloud
    if (user && db) {
      const usersRef = `users/${user.uid}`;
      try {
        for (const splitTx of newTxs) {
          await setDoc(doc(db, `${usersRef}/transactions`, splitTx.id), {
            ...splitTx,
            ownerId: user.uid
          });
        }
        for (const fId of selectFriendIds) {
          const freshFriend = updatedFriends.find(f => f.id === fId);
          if (freshFriend) {
            await setDoc(doc(db, `${usersRef}/friends`, fId), {
              ...freshFriend,
              ownerId: user.uid
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${usersRef}/transactions`);
      }
    }
  };

  // Reset demo state helper
  const handleResetStateData = () => {
    if (confirm("Restore demo seed transactions for testing?")) {
      setFriends(INITIAL_FRIENDS);
      setTransactions(INITIAL_TRANSACTIONS);
      saveLocalStorageBackupState(INITIAL_FRIENDS, INITIAL_TRANSACTIONS);
      setActiveFriend(null);
      alert("Demo data restored successfully.");
    }
  };

  // --- 5. RENDER CHANNELS ---

  // Filter friends of bottom tabs "Customers" (positive/get debt) vs "Suppliers" (negative/owe debt)
  const renderedFriendsList = friends.filter(friend => {
    if (friendsListFilter === 'get') return friend.balance > 0;
    if (friendsListFilter === 'give') return friend.balance < 0;
    return true; // customer vs supplier double categorization
  });

  // Calculate generic cashbook personal logs (non-friend items)
  const cashbookTransactions = transactions.filter(t => !t.friendId);

  if (isAuditWindow) {
    return (
      <AIAuditWorkspace
        friends={friends}
        transactions={transactions}
        currencySymbol={currencySymbol}
        isExternalWindow={true}
      />
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-950 select-none min-h-screen flex items-center justify-center font-sans tracking-tight transition-colors duration-300">
      <div className="w-full max-w-md bg-[#F8FAFC] dark:bg-slate-900 min-h-screen relative shadow-2xl flex flex-col overflow-hidden pb-16 transition-colors duration-300">
        
        {/* Dynamic Route Switching Controller */}
        {activeFriend ? (
          <FriendHistory
            friend={activeFriend}
            transactions={transactions}
            onBack={() => setActiveFriend(null)}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSettleAll={handleSettleFullFriendBalance}
            currencySymbol={currencySymbol}
            onEditFriend={(f) => setEditingFriend(f)}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onDeleteFriend={(fId) => handleDeleteFriend(fId)}
          />
        ) : showAddTransaction ? (
          <AddTransaction
            friends={friends}
            onBack={() => setShowAddTransaction(false)}
            onSave={handleAddTransaction}
            currencySymbol={currencySymbol}
          />
        ) : activeTab === 'friends' ? (
          <Dashboard
            friends={renderedFriendsList}
            onSelectFriend={(friend) => setActiveFriend(friend)}
            onAddFriend={handleAddNewFriend}
            currencySymbol={currencySymbol}
            onEditFriend={(f) => setEditingFriend(f)}
            onDeleteFriend={(fId) => handleDeleteFriend(fId)}
          />
        ) : activeTab === 'cashbook' ? (
          <CashbookInsights
            friends={friends}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onOpenSplitBill={() => setShowSplitModal(true)}
            onOpenMonthlySummary={() => setShowSummaryModal(true)}
            currencySymbol={currencySymbol}
            onResetSeeds={handleResetStateData}
          />
        ) : (
          <Settings
            user={user}
            onUserChange={handleUserChange}
            currencySymbol={currencySymbol}
            onCurrencyChange={(sym) => {
              setCurrencySymbol(sym);
              localStorage.setItem('txnbook_currency_symbol', sym);
            }}
            friends={friends}
            transactions={transactions}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
            onOpenAuditOverlay={() => setShowAuditOverlay(true)}
          />
        )}

        {/* BOTTOM NAVIGATION TABS - Styled carefully matching Mockup 3 */}
        {!activeFriend && !showAddTransaction && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 flex text-center font-bold z-20 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.4)]">
            
            {/* Ledger button for peer-to-peer friends */}
            <button
              onClick={() => {
                setActiveTab('friends');
                setFriendsListFilter('all');
              }}
              className={`flex-1 py-3 text-[10px] tracking-wider uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'friends' ? 'text-indigo-600 dark:text-indigo-400 bg-transparent font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              id="bottom-tab-ledger"
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Ledger</span>
            </button>

            {/* Settle & Insights button representing peer debt settlements plus analytics */}
            <button
              onClick={() => {
                setActiveTab('cashbook');
                setFriendsListFilter('all');
              }}
              className={`flex-1 py-3 text-[10px] tracking-wider uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'cashbook' ? 'text-indigo-600 dark:text-indigo-400 bg-transparent font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              id="bottom-tab-settle"
            >
              <div className="flex items-center gap-1">
                <QrCode className="w-4 h-4 shrink-0" />
                <span className="text-[8px] font-sans text-slate-300 dark:text-slate-600">|</span>
                <TrendingUp className="w-4 h-4 shrink-0" />
              </div>
              <span>Settle & Insights</span>
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                setActiveTab('settings');
              }}
              className={`flex-1 py-3 text-[10px] tracking-wider uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 bg-transparent font-black' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              id="bottom-tab-settings"
            >
              <SettingsIcon className="w-5 h-5 shrink-0" />
              <span>Settings</span>
            </button>

          </div>
        )}

        {/* Split Bill Overlay Component dialog */}
        {showSplitModal && (
          <SplitBillModal 
            friends={friends}
            onClose={() => setShowSplitModal(false)}
            onSplitSave={handleSplitBillSubmit}
            currencySymbol={currencySymbol}
          />
        )}

        {/* Monthly Summary Insights Overlay dialog */}
        {showSummaryModal && (
          <MonthlySummaryModal 
            transactions={transactions}
            friends={friends}
            onClose={() => setShowSummaryModal(false)}
            currencySymbol={currencySymbol}
          />
        )}

        {/* Global Edit Account / Friend Modal Overlay */}
        {editingFriend && (
          <EditFriendModal
            friend={editingFriend}
            onClose={() => setEditingFriend(null)}
            onSave={(name, phone) => handleEditFriend(editingFriend.id, name, phone)}
            onDelete={() => handleDeleteFriend(editingFriend.id)}
          />
        )}

        {/* Global Edit Transaction Modal Overlay */}
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            friends={friends}
            onClose={() => setEditingTransaction(null)}
            onSave={handleEditTransaction}
            onDelete={() => handleDeleteTransaction(editingTransaction.id)}
            currencySymbol={currencySymbol}
          />
        )}

        {/* Global AI Audit Overlay Workspace */}
        {showAuditOverlay && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-0 md:p-4">
            <div className="w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 animate-bento-fade">
              <AIAuditWorkspace
                friends={friends}
                transactions={transactions}
                currencySymbol={currencySymbol}
                onClose={() => setShowAuditOverlay(false)}
                isExternalWindow={false}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
