import React, { useState } from 'react';
import { X, Calculator, CreditCard, Sparkles, Check, Trash2 } from 'lucide-react';
import { Transaction, Friend } from '../types';
import { CATEGORIES } from '../data/initialData';

interface EditTransactionModalProps {
  transaction: Transaction;
  friends: Friend[];
  onClose: () => void;
  onSave: (txId: string, updatedFields: Partial<Transaction>) => void;
  onDelete?: () => void;
  currencySymbol?: string;
}

export default function EditTransactionModal({
  transaction,
  friends,
  onClose,
  onSave,
  onDelete,
  currencySymbol = '₹'
}: EditTransactionModalProps) {
  const [type, setType] = useState<'gave' | 'got'>(transaction.type);
  const [amountStr, setAmountStr] = useState(String(transaction.amount));
  const [selectedCategory, setSelectedCategory] = useState(transaction.category || 'Shared Expense');
  const [note, setNote] = useState(transaction.note || '');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Credit'>(
    transaction.paymentMode || 'Online'
  );
  const [friendId, setFriendId] = useState(transaction.friendId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    onSave(transaction.id, {
      type,
      amount,
      category: selectedCategory,
      note: note.trim(),
      paymentMode,
      friendId: friendId || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-bento-fade max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between">
          <span className="font-extrabold text-xs tracking-wider uppercase font-sans">Edit Transaction</span>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Target Ledger Friend Selector if friend exists */}
          {transaction.friendId && (
            <div>
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Linked Ledger Account
              </label>
              <select
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-3 py-2 text-xs rounded-xl font-sans"
              >
                <option value="">Personal Cashbook (Unlinked)</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type Gave / Got slider */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-205/60 mutual-tabs">
            <button
              type="button"
              onClick={() => setType('gave')}
              className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all ${
                type === 'gave' ? 'bg-[#ef4444] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              I Gave (Lent)
            </button>
            <button
              type="button"
              onClick={() => setType('got')}
              className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all ${
                type === 'got' ? 'bg-[#10b981] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              I Got (Received)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Transaction Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-xs">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-7 pr-3.5 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 rounded-xl text-xs font-bold font-sans"
                required
              />
            </div>
          </div>

          {/* Category Scroller */}
          <div>
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-lg shrink-0 border transition-all ${
                    selectedCategory === cat 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Note Tag
            </label>
            <input
              type="text"
              placeholder="Tag (e.g. Lunch split)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 rounded-xl text-xs"
            />
          </div>

          {/* Payment Modes */}
          <div>
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Online', 'Credit'] as const).map((mode) => {
                const isSelected = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[10px] font-bold ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>
                      {mode === 'Cash' ? '💵' : mode === 'Online' ? '📱' : '💳'}
                    </span>
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex gap-2.5 mt-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this transaction entry from ledger? This will readjust ledger balance totals.")) {
                    onDelete();
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 text-white py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider select-none transition-all"
            >
              Update Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
