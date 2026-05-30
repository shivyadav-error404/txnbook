import React from 'react';
import { X, Calendar, PieChart, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction, Friend } from '../types';

interface MonthlySummaryModalProps {
  transactions: Transaction[];
  friends: Friend[];
  onClose: () => void;
  currencySymbol: string;
}

export default function MonthlySummaryModal({ transactions, friends, onClose, currencySymbol }: MonthlySummaryModalProps) {
  // Group spending by category
  const categoryTotals: { [key: string]: number } = {};
  const paymentModeTotals: { [key: string]: number } = { Cash: 0, Online: 0, Credit: 0 };
  
  let totalLent = 0;
  let totalBorrowed = 0;

  // Process transactions values
  transactions.forEach(t => {
    // Totals by payment modes
    if (t.paymentMode in paymentModeTotals) {
      paymentModeTotals[t.paymentMode] += t.amount;
    }

    // Totals by action type
    if (t.type === 'gave') {
      totalLent += t.amount;
    } else {
      totalBorrowed += t.amount;
    }

    // Category spends
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCategoryVal = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-bento-fade border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white p-4.5 flex items-center justify-between">
          <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans">
            <PieChart className="w-4.5 h-4.5" />
            <span>Monthly Ledger Analysis</span>
          </span>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/15 p-1 rounded-full transition-all text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3.5 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/70">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-slate-400 font-sans tracking-wide">Total Lent</span>
              <span className="text-xs font-black text-emerald-700 font-mono mt-0.5 flex items-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-650 inline mr-0.5 shrink-0" />
                {currencySymbol}{totalLent.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-col border-l border-indigo-100 pl-4">
              <span className="text-[9px] uppercase font-black text-slate-400 font-sans tracking-wide">Total Borrowed</span>
              <span className="text-xs font-black text-rose-700 font-mono mt-0.5 flex items-center">
                <ArrowDownRight className="w-4 h-4 text-rose-600 inline mr-0.5 shrink-0" />
                {currencySymbol}{totalBorrowed.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Bar summary of category logs */}
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block mb-3 font-sans animate-pulse">
              Ledger Volume by Categories
            </span>
            
            <div className="flex flex-col gap-3.5 max-h-48 overflow-y-auto pr-1">
              {sortedCategories.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-4 font-sans">No logged entries yet</p>
              ) : (
                sortedCategories.map(([cat, val]) => {
                  const pct = (val / maxCategoryVal) * 100;
                  return (
                    <div key={cat} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold font-sans">
                        <span className="text-slate-650">{cat}</span>
                        <span className="text-slate-900 font-mono">{currencySymbol}{val.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-350"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Mode breakdown */}
          <div className="border-t border-slate-100 pt-3.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block mb-2 font-sans">
              Volume by Payment Modes
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.entries(paymentModeTotals).map(([mode, val]) => (
                <div key={mode} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">{mode}</span>
                  <span className="text-xs font-black text-slate-800 font-mono">{currencySymbol}{val.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 text-white py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider select-none transition-all mt-2 cursor-pointer"
          >
            Acknowledge Log
          </button>
        </div>
      </div>
    </div>
  );
}
