import React, { useState } from 'react';
import { X, User, Phone, Trash2 } from 'lucide-react';
import { Friend } from '../types';

interface EditFriendModalProps {
  friend: Friend;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
  onDelete?: () => void;
}

export default function EditFriendModal({ friend, onClose, onSave, onDelete }: EditFriendModalProps) {
  const [name, setName] = useState(friend.name);
  const [phone, setPhone] = useState(friend.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), phone.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-bento-fade">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between">
          <span className="font-extrabold text-xs tracking-wider uppercase font-sans">Modify Ledger Account</span>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Friend / Account Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="tel"
                placeholder="e.g. +91 99999 88888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              />
            </div>
          </div>

          <div className="flex gap-2.5 mt-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete account "${friend.name}"? This will clear all transactions associated with this friend.`)) {
                    onDelete();
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Delete complete account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 text-white py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider select-none transition-all"
            >
              Update Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
