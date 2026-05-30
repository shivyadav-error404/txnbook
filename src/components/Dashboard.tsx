import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Plus, UserPlus, Phone, X, AlertCircle } from 'lucide-react';
import { Friend } from '../types';

export function useCountUp(endValue: number, duration: number = 850) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(0);
  const endValueRef = useRef<number>(endValue);

  useEffect(() => {
    startValueRef.current = count;
    endValueRef.current = endValue;
    startTimeRef.current = null;
    
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // cubic bezier Out Easing
      const easeProgress = 1 - Math.pow(1 - percentage, 3);
      
      const nextValue = startValueRef.current + (endValueRef.current - startValueRef.current) * easeProgress;
      setCount(nextValue);

      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [endValue, duration]);

  return count;
}

interface AnimatedBalanceProps {
  value: number;
  currencySymbol: string;
  showSign?: boolean;
}

export function AnimatedBalance({ value, currencySymbol, showSign = false }: AnimatedBalanceProps) {
  const count = useCountUp(value, 850);
  const absValue = Math.abs(value);
  const absCount = Math.abs(count);
  
  const isTargetInteger = absValue % 1 === 0;
  let displayValue: string;
  
  if (isTargetInteger) {
    displayValue = Math.round(absCount).toLocaleString('en-IN');
  } else {
    displayValue = absCount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const sign = showSign && value > 0 ? '+' : showSign && value < 0 ? '-' : '';

  return (
    <span>
      {sign}{currencySymbol}{displayValue}
    </span>
  );
}

interface DashboardProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
  onAddFriend: (name: string, phone: string, initialBalance: number, isGive: boolean) => void;
  currencySymbol: string;
  onEditFriend: (friend: Friend) => void;
  onDeleteFriend: (friendId: string) => void;
}

export default function Dashboard({ 
  friends, 
  onSelectFriend, 
  onAddFriend, 
  currencySymbol,
  onEditFriend,
  onDeleteFriend
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'get' | 'give' | 'settled'>('all');
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [activeDropdownFriendId, setActiveDropdownFriendId] = useState<string | null>(null);

  // Form states for adding a friend
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [initialBalString, setInitialBalString] = useState('');
  const [isGive, setIsGive] = useState(false); // false = I will get (lent), true = I give

  // Calculate stats exactly as depicted in the top card
  const totalI_llGet = friends
    .filter(f => f.balance > 0)
    .reduce((sum, f) => sum + f.balance, 0);

  const totalIGive = friends
    .filter(f => f.balance < 0)
    .reduce((sum, f) => sum + Math.abs(f.balance), 0);

  // Filtered friends list
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (friend.phone && friend.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    if (filterType === 'get') return friend.balance > 0;
    if (filterType === 'give') return friend.balance < 0;
    if (filterType === 'settled') return friend.balance === 0;
    return true;
  }).filter(friend => {
    // Re-apply explicit state filter for button switches
    if (filterType === 'get') return friend.balance > 0;
    if (filterType === 'give') return friend.balance < 0;
    if (filterType === 'settled') return friend.balance === 0;
    return true;
  });

  const handleCreateFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const amount = initialBalString ? parseFloat(initialBalString) : 0;
    onAddFriend(
      newName.trim(), 
      newPhone.trim(), 
      isNaN(amount) ? 0 : amount, 
      isGive
    );

    // Reset and close
    setNewName('');
    setNewPhone('');
    setInitialBalString('');
    setIsGive(false);
    setShowAddModal(false);
  };

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Visual Header matching Screen 1 (Bento Accent banner style) */}
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white pt-7 pb-20 px-4 rounded-b-[32px] shadow-md relative">
        <h1 className="text-center font-sans font-black text-lg tracking-tight uppercase">
          TxnBook
        </h1>
        
        {/* Floating Balance banner exactly as depicted in S1 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-45px] w-[90%] max-w-sm bg-white dark:bg-slate-900 py-4 px-5 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold mb-1">
            Accounts Net Status
          </span>
          <div className="flex w-full justify-between items-center mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 px-3">
            <div className="text-center border-r border-slate-100 dark:border-slate-800 pr-4 flex-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Total I'll Give</p>
              <p className="text-base font-black text-rose-600 font-mono mt-0.5">
                <AnimatedBalance value={totalIGive} currencySymbol={currencySymbol} />
              </p>
            </div>
            <div className="text-center pl-4 flex-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Total I'll Get</p>
              <p className="text-base font-black text-emerald-600 font-mono mt-0.5">
                <AnimatedBalance value={totalI_llGet} currencySymbol={currencySymbol} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content below the floating card */}
      <div className="max-w-md mx-auto px-4 pt-16">
        
        {/* Title */}
        <div className="flex justify-between items-center mb-4 mt-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            Ledger Accounts
          </h2>
          <span className="bg-indigo-50 border border-indigo-100 dark:bg-slate-800 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-xl">
            {friends.length} Active
          </span>
        </div>

        {/* Search bar matching Image 1 */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search friends & family"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans shadow-sm"
              id="friends-search-input"
            />
          </div>
          <button
            onClick={() => setShowFilterSettings(!showFilterSettings)}
            className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center transition-all ${filterType !== 'all' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="Filter ledger accounts"
            id="filter-settings-toggle"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Quick filter selection tabs */}
        {showFilterSettings && (
          <div className="flex gap-2 mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-wrap animate-bento-fade">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase w-full mb-1">Accounts Filter</span>
            {(['all', 'get', 'give', 'settled'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${filterType === type ? 'bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {type === 'all' ? 'All' : type === 'get' ? "I'll Get" : type === 'give' ? "I'll Give" : 'Settled'}
              </button>
            ))}
          </div>
        )}

        {/* Accounts List container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800/80 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="w-9 h-9 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">No matching friends in ledger</p>
              <p className="text-[10px] text-slate-400 mt-1">Try searching for other names or add a new friend.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFriends.map((friend) => {
                const isPositive = friend.balance > 0;
                const isZero = friend.balance === 0;
                
                return (
                  <div
                    key={friend.id}
                    onClick={() => onSelectFriend(friend)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/75 dark:hover:bg-slate-800/80 transition-all text-left border-b border-slate-100 dark:border-slate-800/60 last:border-none cursor-pointer"
                    id={`friend-item-${friend.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs tracking-wider border border-indigo-100 dark:border-indigo-900">
                          {friend.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-sans font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug">
                          {friend.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">
                          Last entry: {new Date(friend.lastUpdate).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(friend.lastUpdate).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 plan-actions">
                      <div className="text-right font-mono">
                        {isZero ? (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">
                            Settled
                          </span>
                        ) : isPositive ? (
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-lg animate-bento-fade">
                            <AnimatedBalance value={friend.balance} currencySymbol={currencySymbol} showSign={true} />
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 px-2 py-0.5 rounded-lg font-mono animate-bento-fade">
                            <AnimatedBalance value={friend.balance} currencySymbol={currencySymbol} showSign={true} />
                          </span>
                        )}
                      </div>

                      {/* 3-dot dropdown menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownFriendId(activeDropdownFriendId === friend.id ? null : friend.id);
                          }}
                          className="p-1 px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <span className="font-extrabold text-[12px] tracking-widest block">•••</span>
                        </button>

                        {activeDropdownFriendId === friend.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownFriendId(null);
                              }}
                            />
                            <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditFriend(friend);
                                  setActiveDropdownFriendId(null);
                                }}
                                className="w-full px-3 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-705 flex items-center gap-1.5 cursor-pointer"
                              >
                                📝 Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFriend(friend.id);
                                  setActiveDropdownFriendId(null);
                                }}
                                className="w-full px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 cursor-pointer border-t border-slate-50 dark:border-slate-800"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Friend Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-4 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white flex items-center gap-1.5 px-4.5 py-3 rounded-full shadow-lg shadow-blue-500/20 font-sans font-black text-xs select-none hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
        id="add-friend-floating-btn"
      >
        <Plus className="w-4 h-4" />
        <span>Add friend</span>
      </button>

      {/* Add Friend Modal dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 animate-bento-fade">
            
            <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wider uppercase font-sans">Add Ledger Account</span>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:bg-white/15 p-1 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFriendSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Friend name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amit Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 99999 88888"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Initial balance (optional)
                </label>
                <div className="flex gap-2">
                  <span className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-500 font-bold font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={initialBalString}
                    onChange={(e) => setInitialBalString(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              {initialBalString && parseFloat(initialBalString) > 0 && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight block mb-1">Ledger Direction</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGive(false)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center border transition-all ${!isGive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      They give me
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGive(true)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-center border transition-all ${isGive ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      I give them
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 select-none transition-all mt-2"
                id="save-new-friend-btn"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
