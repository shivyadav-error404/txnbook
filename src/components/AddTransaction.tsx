import React, { useState } from 'react';
import { ArrowLeft, Calculator, Camera, Check, Users, AlertCircle, Sparkles, CreditCard, Key } from 'lucide-react';
import { Friend, Transaction } from '../types';
import { CATEGORIES, PAYMENT_MODES } from '../data/initialData';

interface AddTransactionProps {
  friends: Friend[];
  defaultFriendId?: string;
  onBack: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  currencySymbol?: string;
}

export default function AddTransaction({
  friends,
  defaultFriendId = '',
  onBack,
  onSave,
  currencySymbol = '₹'
}: AddTransactionProps) {
  const [friendId, setFriendId] = useState(defaultFriendId);
  const [type, setType] = useState<'gave' | 'got'>('gave');
  const [amountStr, setAmountStr] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Shared Expense');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Credit'>('Online');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    onSave({
      friendId: friendId || undefined,
      type,
      amount,
      category: selectedCategory,
      note: note.trim() || `${selectedCategory} transaction`,
      paymentMode,
      photoUrl: photoUrl || undefined,
      isSplit
    });

    onBack();
  };

  const simulateAddPhoto = () => {
    setPhotoUrl('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=350&fit=crop');
    setPhotoAdded(true);
    setTimeout(() => {
      alert("Simulated: Custom receipt photo scanned and attached securely.");
    }, 100);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-24">
      {/* Visual Header matching Screen 4 */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-1 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
          id="add-tx-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-extrabold font-sans text-slate-900 text-xs tracking-wider uppercase">
          Add Ledger Entry
        </h1>
        <div className="w-5 h-5" /> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-5 pt-3.5 flex flex-col gap-5 select-none animate-bento-fade">
        
        {/* Friend Selector - Merges Personal & Friend Flows */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Target account / Ledger Friend</span>
          </label>
          <select
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            id="choose-friend-dropdown"
          >
            <option value="">Personal Entry (Non-friend Cashbook)</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (Current: {currencySymbol}{f.balance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        {/* Gave / Got Toggles matching Screen 4 */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-205/60 mutual-tabs">
          <button
            type="button"
            onClick={() => setType('gave')}
            className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all ${type === 'gave' ? 'bg-[#ef4444] text-white shadow-md' : 'text-slate-500 hover:text-slate-705'}`}
          >
            I Gave (Lent / Charged)
          </button>
          
          <button
            type="button"
            onClick={() => setType('got')}
            className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all ${type === 'got' ? 'bg-[#10b981] text-white shadow-md' : 'text-slate-500 hover:text-slate-705'}`}
          >
            I Got (Borrowed / Received)
          </button>
        </div>

        {/* Amount Input matching Screen 4 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">
            Amount
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base font-bold flex items-center gap-1 border-r border-slate-200 pr-3.5 font-mono">
              <Calculator className="w-5 h-5 text-slate-400" />
              <span>{currencySymbol}</span>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full pl-22 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-lg font-black focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans tracking-tight shadow-sm"
              required
              id="amount-field-input"
            />
          </div>
        </div>

        {/* Split Equally Switch matching Screen 4 */}
        {friendId && (
          <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
            <div>
              <span className="text-xs font-black text-slate-800 block">Split equally</span>
              <span className="text-[10px] text-slate-400 leading-none">Calculate and divide 50/50 automatically</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        )}

        {/* Selected Category Tag selection scroll matching Screen 4 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
            Category Tag
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl snap-center shrink-0 border transition-all ${selectedCategory === cat ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Note input matching Screen 4 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
            Note Description
          </label>
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs leading-none focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-sm"
            id="transaction-note-field"
          />
        </div>

        {/* Payment Mode options grid/list matching Screen 4 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
            Payment Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Cash', 'Online', 'Credit'] as const).map((mode) => {
              const works = paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-3.5 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${works ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-md ring-1 ring-indigo-200' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-base">
                    {mode === 'Cash' ? '💵' : mode === 'Online' ? '📱' : '💳'}
                  </span>
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add photo selection button matching Screen 4 */}
        <button
          type="button"
          onClick={simulateAddPhoto}
          className={`w-full py-3.5 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 text-xs font-bold font-sans transition-all active:scale-98 ${photoAdded ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:border-slate-300'}`}
          id="simulate-add-photo-btn"
        >
          <Camera className="w-4 h-4" />
          <span>{photoAdded ? 'Photo Scanned OK ✓' : 'Add Photo / Scan Receipt'}</span>
        </button>

        {/* Floating Save Button at bottom matching Screen 4 */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 py-3.5 px-4 shadow-lg z-10 max-w-md mx-auto right-0">
          <button
            type="submit"
            className={`w-full text-white py-3.5 rounded-2xl font-black uppercase tracking-wider font-sans text-xs shadow-md transition-all select-none hover:scale-[1.01] active:scale-95 ${type === 'gave' ? 'bg-[#ef4444] hover:bg-[#dc2626] shadow-red-205' : 'bg-[#10b981] hover:bg-[#059669] shadow-emerald-205'}`}
            id="save-tx-entry-btn"
          >
            Save Transaction
          </button>
        </div>

      </form>
    </div>
  );
}
