import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, CheckCircle, Trash2, Calendar, DollarSign, Send, Share2 } from 'lucide-react';
import { Friend, Transaction } from '../types';
import { CATEGORIES } from '../data/initialData';

interface FriendHistoryProps {
  friend: Friend;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
  onSettleAll: () => void;
  currencySymbol: string;
  onEditFriend: (friend: Friend) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteFriend: (friendId: string) => void;
}

export default function FriendHistory({
  friend,
  transactions,
  onBack,
  onAddTransaction,
  onDeleteTransaction,
  onSettleAll,
  currencySymbol,
  onEditFriend,
  onEditTransaction,
  onDeleteFriend
}: FriendHistoryProps) {
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const [showNudgeDialog, setShowNudgeDialog] = useState(false);
  const [nudgeCopied, setNudgeCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [activeDropdownTxId, setActiveDropdownTxId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState(false);

  // Load UPI configurations if saved
  const upiConfig = (() => {
    try {
      const stored = localStorage.getItem('txnbook_payment_qr_config');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const friendTransactions = transactions.filter(t => t.friendId === friend.id);

  // Sorting transactions newest first
  const sortedTransactions = [...friendTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isOwed = friend.balance > 0;
  const isOwe = friend.balance < 0;
  const isSettled = friend.balance === 0;

  // Icons matching categories
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'lunch':
      case 'coffee':
      case 'grocery':
        return { bg: 'bg-[#FEF6E4] text-[#D6A035]', icon: '🍲' };
      case 'movie':
      case 'shopping':
      case 'gift':
        return { bg: 'bg-[#EAF3FA] text-[#4A8EC3]', icon: '🎬' };
      case 'rent':
        return { bg: 'bg-[#FBEBEA] text-[#D95F5E]', icon: '🏠' };
      case 'travel':
        return { bg: 'bg-[#EAF8F1] text-[#3FA971]', icon: '🚗' };
      default:
        return { bg: 'bg-gray-105 text-gray-500', icon: '📝' };
    }
  };

  const shareNudge = () => {
    const text = `Hi ${friend.name}, just a gentle reminder from myKhata Ledger. We have a pending balance of ₹${Math.abs(friend.balance).toLocaleString('en-IN')}. Please verify details when convenient. Thanks!`;
    if (navigator.share) {
      navigator.share({
        title: 'Ledger Reminder Nudge',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setNudgeCopied(true);
      setTimeout(() => setNudgeCopied(false), 2000);
    }
  };

  const handleQuickAddAction = (type: 'gave' | 'got') => {
    const amount = quickAmount || 0;
    if (amount <= 0) return;

    onAddTransaction({
      friendId: friend.id,
      type,
      amount,
      category: 'Shared Expense',
      note: customNote.trim() || `${type === 'gave' ? 'I Gave' : 'I Got'} - Quick Add`,
      paymentMode: 'Online'
    });

    // Reset quick choices
    setQuickAmount(null);
    setCustomNote('');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-805 pb-28">
      {/* Visual Header matching Screen 2 */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm font-sans tracking-tight leading-tight">
              {friend.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {friend.phone || 'Personal ledger link'}
            </p>
          </div>
        </div>

        {/* Actions section */}
        <div className="flex items-center gap-1.5 justify-end">
          {/* Nudge remind button */}
          {!isSettled && (
            <button
              onClick={() => setShowNudgeDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-full font-bold font-sans text-[10px] uppercase tracking-wide transition-all cursor-pointer"
              id="remind-nudge-btn"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Remind</span>
            </button>
          )}

          {/* Account Menu 3-dot options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="p-1.5 px-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Account Options"
            >
              <span className="font-extrabold text-[12px] tracking-widest block">•••</span>
            </button>
            {showAccountDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowAccountDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-150 rounded-xl shadow-lg py-1 z-45 text-left text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      onEditFriend(friend);
                      setShowAccountDropdown(false);
                    }}
                    className="w-full px-3.5 py-2 text-slate-705 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    📝 Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteFriend(friend.id);
                      setShowAccountDropdown(false);
                      onBack();
                    }}
                    className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-50"
                  >
                    🗑️ Delete ledger
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 select-none">
        {/* Profile Balance Card with Avatar matching Screen 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center animate-bento-fade relative overflow-hidden mb-5">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5]" />
          
          {friend.avatarUrl ? (
            <img
              src={friend.avatarUrl}
              alt={friend.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-650 font-sans font-black flex items-center justify-center text-xl tracking-wider border-4 border-slate-50 shadow-xs">
              {friend.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}

          <h3 className="text-sm font-black text-slate-900 mt-3 font-sans">
            {friend.name}
          </h3>

          {isSettled ? (
            <p className="text-emerald-700 text-[10px] uppercase font-bold mt-2 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>All balances fully settled</span>
            </p>
          ) : isOwed ? (
            <div className="mt-2">
              <p className="text-slate-400 text-[9px] uppercase font-black tracking-wider">You Get</p>
              <p className="text-xl font-black text-[#10b981] tracking-tight mt-0.5 font-sans">
                {currencySymbol}{friend.balance.toLocaleString('en-IN')}
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-slate-400 text-[9px] uppercase font-black tracking-wider">You Give</p>
              <p className="text-xl font-black text-[#ef4444] tracking-tight mt-0.5 font-sans">
                {currencySymbol}{Math.abs(friend.balance).toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Quick settlement button */}
          {!isSettled && (
            <div className="flex flex-wrap gap-2.5 justify-center mt-4">
              <button
                onClick={onSettleAll}
                className="px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Settle Full Balance</span>
              </button>
              
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>💳 Show Settlement QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Transactions list header */}
        <div className="flex justify-between items-center mb-2.5 px-1 animate-bento-fade">
          <span className="text-[10px] uppercase tracking-wider font-black text-slate-400 font-sans">
            Transaction Ledger ({friendTransactions.length})
          </span>
          <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Latest entries</span>
          </span>
        </div>

        {/* Sorted Ledger list */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6 divide-y divide-slate-100 animate-bento-fade">
          {sortedTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center font-sans gap-2">
              <DollarSign className="w-10 h-10 text-slate-200 mb-1" />
              <span className="font-bold text-slate-500">No transactions with {friend.name}</span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[210px] leading-relaxed">Use Quick Add or buttons below to start scanning invoices or recording ledger credits.</p>
            </div>
          ) : (
            sortedTransactions.map((tx) => {
              const { bg, icon } = getCategoryIcon(tx.category);
              const txDate = new Date(tx.date);
              
              return (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Visual category circle matching S2 */}
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center text-sm shadow-inner`}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs font-sans">
                        {tx.note || tx.category}
                      </h4>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5 font-sans">
                        {txDate.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}, {tx.paymentMode} mode
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-xs text-slate-900 font-sans">
                        {currencySymbol}{tx.amount.toLocaleString('en-IN')}
                      </p>
                      <span className={`text-[9px] uppercase tracking-wide font-black px-2 py-0.5 rounded-md ${tx.type === 'gave' ? 'text-rose-600 bg-rose-50/70 border border-rose-100' : 'text-emerald-600 bg-emerald-50/70 border border-emerald-100'}`}>
                        {tx.type === 'gave' ? 'I Gave' : 'I Got'}
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdownTxId(activeDropdownTxId === tx.id ? null : tx.id)}
                        className="p-1 px-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-105 transition-colors cursor-pointer"
                        title="Options"
                      >
                        <span className="font-extrabold text-[12px] tracking-widest block">•••</span>
                      </button>

                      {activeDropdownTxId === tx.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setActiveDropdownTxId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-150 rounded-xl shadow-lg py-1 z-40 text-left text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                onEditTransaction(tx);
                                setActiveDropdownTxId(null);
                              }}
                              className="w-full px-3 py-2 text-slate-705 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              📝 Edit Entry
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Delete this transaction? This will adjust the ledger balance accordingly.")) {
                                  onDeleteTransaction(tx.id);
                                }
                                setActiveDropdownTxId(null);
                              }}
                              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer border-t border-slate-50"
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
            })
          )}
        </div>

        {/* Quick Add Interface Card matching bottom of Screen 2 */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm mb-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Quick Add
          </p>
          
          <div className="flex gap-2.5 mb-3">
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setQuickAmount(amt)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${quickAmount === amt ? 'bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border-blue-400/30 text-white shadow-sm ring-1 ring-blue-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {currencySymbol}{amt}
              </button>
            ))}
          </div>

          {quickAmount !== null && (
            <div className="flex flex-col gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 animate-bento-fade">
              <input
                type="text"
                placeholder="Custom description tag (e.g. Dinner, Tea)"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-205 rounded-xl text-xs leading-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setQuickAmount(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex-1 flex gap-2 justify-end">
                  <span className="text-[10px] font-bold text-slate-400 self-center mr-1">Log: {currencySymbol}{quickAmount}</span>
                  <button
                    onClick={() => handleQuickAddAction('gave')}
                    className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-rose-100"
                  >
                    I Gave
                  </button>
                  <button
                    onClick={() => handleQuickAddAction('got')}
                    className="px-3.5 py-2 bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-[#10b981]/20"
                  >
                    I Got
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom action buttons matching Screen 2 */}
      {quickAmount === null && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 py-3.5 px-4 shadow-lg z-10 flex gap-4 max-w-md mx-auto right-0">
          <button
            onClick={() => {
              setQuickAmount(500);
              setTimeout(() => {
                const form = document.querySelector('input[placeholder*="Custom description"]');
                (form as any)?.focus();
              }, 100);
            }}
            className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-xs shadow-md transition-all select-none cursor-pointer"
            id="gave-action-btn"
          >
            <DollarSign className="w-4 h-4" />
            <span>I Gave (Lent)</span>
          </button>
          
          <button
            onClick={() => {
              setQuickAmount(500);
              setTimeout(() => {
                const form = document.querySelector('input[placeholder*="Custom description"]');
                (form as any)?.focus();
              }, 100);
            }}
            className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-xs shadow-md transition-all select-none cursor-pointer"
            id="got-action-btn"
          >
            <DollarSign className="w-4 h-4" />
            <span>I Got (Borrowed)</span>
          </button>
        </div>
      )}

      {/* Remind Nudge Dialog Modal */}
      {showNudgeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-bento-fade border border-slate-100">
            <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between animate-pulse">
              <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                <span>Nudge Ledger Reminder</span>
              </span>
              <button 
                onClick={() => setShowNudgeDialog(false)}
                className="text-white hover:bg-white/15 p-1 rounded-full transition-all text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                Send a preformatted, polite ledger summary nudge message to {friend.name}. Excellent for sending over WhatsApp or copy pasting.
              </p>

              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100/70 rounded-2xl mb-4 text-[10px] font-mono text-indigo-900 leading-relaxed select-all shadow-inner font-sans">
                Hi {friend.name}, just a gentle reminder from TxnBook Ledger. We have a pending balance of {currencySymbol}{Math.abs(friend.balance).toLocaleString('en-IN')}. Please verify details when convenient. Thanks!
              </div>

              <div className="flex gap-3">
                <button
                  onClick={shareNudge}
                  className="flex-1 py-2.5 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{nudgeCopied ? 'Copied to Clipboard!' : 'Share Nudge'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNudgeDialog(false)}
                  className="px-4 py-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-150 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Payment Settlement QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-bento-fade">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-4.5 flex items-center justify-between">
              <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider block">
                💳 QR Settlement Drawer
              </span>
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-white hover:bg-white/15 px-2 py-1 rounded-full transition-all text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col items-center">
              {upiConfig ? (
                (() => {
                  const payAmount = Math.abs(friend.balance);
                  const isNepal = upiConfig.region === 'NP';
                  
                  // Generate custom QR parameters depending on region
                  let payloadUrl = '';
                  let qrThemeColor = 'border-indigo-600';
                  let brandLabel = 'Instant Scan to Pay';
                  let brandBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                  
                  if (!isNepal) {
                    payloadUrl = `upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(upiConfig.payeeName)}&am=${payAmount}&cu=INR&tn=${encodeURIComponent('Co-Settle ' + friend.name)}`;
                  } else {
                    qrThemeColor = upiConfig.nepalSystem === 'esewa' ? 'border-[#60bb46]' :
                                   upiConfig.nepalSystem === 'khalti' ? 'border-[#5c2d91]' : 'border-[#e6302e]';
                    
                    brandLabel = upiConfig.nepalSystem === 'esewa' ? 'eSewa Wallet Pay' :
                                 upiConfig.nepalSystem === 'khalti' ? 'IME Khalti Pay' :
                                 'Fonepay / Mobile banking';
                    
                    brandBg = upiConfig.nepalSystem === 'esewa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              upiConfig.nepalSystem === 'khalti' ? 'bg-purple-50 text-purple-650 border border-purple-100' :
                              'bg-rose-50 text-rose-600 border border-rose-100';
                              
                    if (upiConfig.nepalSystem === 'esewa') {
                      payloadUrl = `esewa://pay?id=${upiConfig.walletId}&name=${encodeURIComponent(upiConfig.payeeName)}&am=${payAmount}`;
                    } else if (upiConfig.nepalSystem === 'khalti') {
                      payloadUrl = `khalti://pay?phone=${upiConfig.walletId}&name=${encodeURIComponent(upiConfig.payeeName)}&am=${payAmount}`;
                    } else {
                      payloadUrl = `fonepay://pay?phone=${upiConfig.walletId}&merchantName=${encodeURIComponent(upiConfig.payeeName)}&am=${payAmount}`;
                    }
                  }
                  
                  const qrUrl = upiConfig.customQRImage || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(payloadUrl)}`;
                  
                  return (
                    <div className="w-full text-center">
                      <div className="mb-3.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 inline-block relative">
                        {/* Scanning frame accents matching system colors */}
                        <div className={`absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 ${qrThemeColor} rounded-tl`} />
                        <div className={`absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 ${qrThemeColor} rounded-tr`} />
                        <div className={`absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 ${qrThemeColor} rounded-bl`} />
                        <div className={`absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 ${qrThemeColor} rounded-br`} />
                        
                        <img 
                          src={qrUrl} 
                          alt="Payee UPI QR" 
                          className="w-44 h-44 rounded-lg mix-blend-multiply"
                        />
                      </div>

                      <div className="mb-3">
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md inline-block ${brandBg}`}>
                          {brandLabel}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 mt-1.5">{upiConfig.payeeName}</h4>
                        <p className="text-[10px] font-semibold text-slate-405 font-mono mt-0.5 select-all text-center">
                          {!isNepal ? upiConfig.upiId : `${upiConfig.nepalSystem.toUpperCase()}: ${upiConfig.walletId}`}
                        </p>
                        
                        <div className="mt-2 text-left bg-slate-50 rounded-2xl border border-slate-100 p-3 select-text">
                          <span className="text-[8px] uppercase font-black text-slate-400 tracking-wide block mb-1">
                            Outstanding Balance Due
                          </span>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-indigo-650 font-mono">
                              {currencySymbol}{payAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] text-[#cd2c2c] dark:text-rose-400 font-extrabold bg-rose-50/50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                              Debit: {friend.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Configured bank info list if populated */}
                      {(!isNepal ? (upiConfig.bankName || upiConfig.accNumber) : (upiConfig.nepalBankName || upiConfig.nepalAccNumber)) && (
                        <div className="text-left w-full bg-slate-50 border border-slate-105 p-3 rounded-2xl mb-3 text-[10px] font-sans text-slate-600 space-y-1">
                          <span className="text-[8px] tracking-wider uppercase font-black text-slate-400 block mb-1">🏦 Bank settlement coordinates</span>
                          {!isNepal ? (
                            <>
                              {upiConfig.bankName && <p className="font-bold text-slate-705">Bank: <span className="font-semibold text-slate-550">{upiConfig.bankName}</span></p>}
                              {upiConfig.accNumber && <p className="font-bold text-slate-705">A/C: <span className="font-mono text-slate-550 select-all">{upiConfig.accNumber}</span></p>}
                              {upiConfig.ifscCode && <p className="font-bold text-slate-705">IFSC: <span className="font-mono text-slate-550 select-all">{upiConfig.ifscCode}</span></p>}
                            </>
                          ) : (
                            <>
                              {upiConfig.nepalBankName && <p className="font-bold text-slate-705">Bank: <span className="font-semibold text-slate-550">{upiConfig.nepalBankName}</span></p>}
                              {upiConfig.nepalAccNumber && <p className="font-bold text-slate-705">A/C: <span className="font-mono text-slate-550 select-all">{upiConfig.nepalAccNumber}</span></p>}
                              {upiConfig.nepalBranch && <p className="font-bold text-slate-705">Branch: <span className="font-semibold text-slate-550">{upiConfig.nepalBranch}</span></p>}
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const valToCopy = !isNepal ? upiConfig.upiId : upiConfig.walletId;
                            navigator.clipboard.writeText(valToCopy);
                            setDetailsCopied(true);
                            setTimeout(() => setDetailsCopied(false), 2000);
                          }}
                          className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-650 rounded-xl text-[10px] font-sans font-bold transition-all border border-indigo-100/80 cursor-pointer"
                        >
                          {detailsCopied ? 'Copied ID!' : !isNepal ? 'Copy UPI' : 'Copy Wallet ID'}
                        </button>
                        <button
                          onClick={() => {
                            const bankText = !isNepal 
                              ? `Bank: ${upiConfig.bankName}, Account: ${upiConfig.accNumber}, IFSC: ${upiConfig.ifscCode}`
                              : `Bank: ${upiConfig.nepalBankName}, Account: ${upiConfig.nepalAccNumber}, Branch: ${upiConfig.nepalBranch}`;
                            navigator.clipboard.writeText(bankText);
                            alert('Bank details copied to clipboard!');
                          }}
                          className="px-3 py-2 hover:bg-slate-50 text-slate-650 rounded-xl text-[10px] bg-white border border-slate-200 cursor-pointer"
                        >
                          📋 Bank Info
                        </button>
                      </div>

                      <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-3.5 bg-slate-50 p-2 rounded-xl text-center">
                        {!isNepal 
                          ? 'Scan using GPay, PhonePe, Paytm, or BHIM to settle instantly.' 
                          : `Settle NRs. ${payAmount.toLocaleString('en-IN')} using eSewa, IME Khalti, or Mobile Banking.`}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3 border border-indigo-100">
                    💳
                  </div>
                  <h4 className="text-xs font-black text-slate-800">Settle Profile Inactive</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[210px] leading-relaxed mx-auto">
                    Setup your Indian UPI or Nepali payment wallets (eSewa / IME Khalti / Fonepay) inside the Settle tab to generate custom codes.
                  </p>
                  
                  <div className="my-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl text-left text-[9px] text-slate-500 font-sans space-y-1.5 leading-tight">
                    <p className="font-bold text-slate-705">How to activate quick pay QR:</p>
                    <p>1. Open the <strong className="text-indigo-600 font-bold">Settle & Insights</strong> tab.</p>
                    <p>2. Select the <strong className="text-indigo-600 font-bold">Settlement QR</strong> sub tab.</p>
                    <p>3. Input your region, payee name, wallet IDs, and bank specs.</p>
                  </div>

                  <button
                    onClick={() => setShowQRModal(false)}
                    className="px-5 py-2.5 bg-blue-500/80 backdrop-blur-md border border-blue-400/30 text-white hover:bg-blue-600/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    Alright!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
