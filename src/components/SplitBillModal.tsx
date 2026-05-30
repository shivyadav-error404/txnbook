import React, { useState } from 'react';
import { X, Users, Check, AlertCircle, Share2, Clipboard, Users2 } from 'lucide-react';
import { Friend } from '../types';

interface SplitBillModalProps {
  friends: Friend[];
  onClose: () => void;
  onSplitSave: (totalAmount: number, description: string, selectedFriendIds: string[]) => void;
  currencySymbol: string;
}

export default function SplitBillModal({ friends, onClose, onSplitSave, currencySymbol }: SplitBillModalProps) {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [splitLinkCopied, setSplitLinkCopied] = useState(false);

  // Form toggle checkbox helpers
  const handleToggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFriends.length === friends.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(friends.map(f => f.id));
    }
  };

  // Calculations
  const amount = parseFloat(amountStr) || 0;
  // Included people = selected friends + me (1)
  const peopleCount = selectedFriends.length + 1;
  const share = amount / (peopleCount > 0 ? peopleCount : 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || selectedFriends.length === 0 || !description.trim()) return;
    
    // Trigger split ledger saving
    onSplitSave(amount, description.trim(), selectedFriends);
    onClose();
  };

  const copyCustomSplitLink = () => {
    const text = `Hey guys, I am setting up a bill splits on TxnBook! Total Bill: ${currencySymbol}${amount.toLocaleString('en-IN')} for "${description}". Each share is ${currencySymbol}${share.toLocaleString('en-IN')}. Pay me back on my ledger or UPI! Detailed logs: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setSplitLinkCopied(true);
    setTimeout(() => setSplitLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-bento-fade border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between">
          <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans">
            <Users2 className="w-4.5 h-4.5" />
            <span>Split a Shared Bill</span>
          </span>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/15 p-1 rounded-full transition-all text-xs"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Bill Total Amount
            </label>
            <div className="flex gap-2">
              <span className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-500 font-bold self-center font-mono">
                {currencySymbol}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Description (e.g. Pizza dinner, Cab splits)
            </label>
            <input
              type="text"
              placeholder="Pizza dinner split"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Friends Selector list */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Select friends *
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] text-indigo-600 font-bold hover:underline"
              >
                {selectedFriends.length === friends.length ? 'Clear All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100">
              {friends.length === 0 ? (
                <p className="p-4 text-xs text-center text-slate-400">Add friends on the homepage first!</p>
              ) : (
                friends.map((friend) => {
                  const isChecked = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleToggleFriend(friend.id)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-705"
                    >
                      <span>{friend.name}</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-65 bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Share calculation display */}
          {amount > 0 && selectedFriends.length > 0 && (
            <div className="bg-indigo-50/40 border border-indigo-100 p-3 rounded-2xl flex flex-col gap-1.5 text-xs text-indigo-900 font-semibold shadow-inner">
              <div className="flex justify-between">
                <span>Split between:</span>
                <span className="font-extrabold">{peopleCount} people (including You)</span>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-1.5 text-xs font-bold font-sans">
                <span>Value per share:</span>
                <span className="text-indigo-700 font-extrabold font-mono">{currencySymbol}{share.toFixed(2)}</span>
              </div>
              
              <button
                type="button"
                onClick={copyCustomSplitLink}
                className="mt-1 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 leading-none shadow-xs"
              >
                <Share2 className="w-3 h-3" />
                <span>{splitLinkCopied ? 'Link Copied Correctly!' : 'Share Split link (WhatsApp)'}</span>
              </button>
            </div>
          )}

          {/* Save trigger button */}
          <button
            type="submit"
            disabled={amount <= 0 || selectedFriends.length === 0}
            className="w-full bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 disabled:opacity-40 text-white py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider select-none transition-all mt-1 cursor-pointer"
            id="confirm-bill-split-btn"
          >
            Confirm Split & Append Ledger
          </button>
        </form>
      </div>
    </div>
  );
}
