import React, { useState } from 'react';
import { Users, FileText, ArrowRight, Share2, Clipboard, Sparkles, Receipt, Check, Sun, Moon } from 'lucide-react';
import { Friend, Transaction } from '../types';

interface InsightsProps {
  friends: Friend[];
  transactions: Transaction[];
  onOpenSplitBill: () => void;
  onOpenMonthlySummary: () => void;
  currencySymbol: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Insights({ 
  friends, 
  transactions, 
  onOpenSplitBill, 
  onOpenMonthlySummary, 
  currencySymbol,
  isDarkMode = false,
  onToggleDarkMode
}: InsightsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Weekly spending & lending static model matching Screen 3 precisely
  // To allow interactive hover, we can track selected day
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const greenData = [105.54, 0.96, 15.99, 1.50, 15.23, 1.51, 11.20]; // Personal Spending
  const redData = [1.04, 8.74, 1.81, 10.30, 1.61, 20.31, 0.31];   // Money Lent

  // Helper to map values to SVG space (height = 200, padding = 40)
  // Max value in data is approx 110, let's set chart scale max to 160
  const width = 450;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const getCoordinates = (index: number, val: number, isGreen: boolean) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / 6;
    // Cap height scaling
    const maxScale = 120;
    const y = height - paddingY - (val / maxScale) * (height - 2 * paddingY);
    return { x, y };
  };

  // Generate SVG Path for a natural smooth bezier curve
  const generateBezierCurve = (data: number[], isGreen: boolean) => {
    let path = '';
    const points = data.map((val, idx) => getCoordinates(idx, val, isGreen));
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        path += `M ${points[i].x} ${points[i].y}`;
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        // Control points for smooth bezier splines
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
    }
    return path;
  };

  const greenPath = generateBezierCurve(greenData, true);
  const redPath = generateBezierCurve(redData, false);

  // Create filled paths for smooth gradients
  const generateFilledArea = (path: string, data: number[], isGreen: boolean) => {
    const points = data.map((val, idx) => getCoordinates(idx, val, isGreen));
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = height - paddingY;
    return `${path} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  };

  const greenArea = generateFilledArea(greenPath, greenData, true);
  const redArea = generateFilledArea(redPath, redData, false);

  const copyQuickSplit = () => {
    navigator.clipboard.writeText(`Hey friends, let's split our expenses! Join TxnBook here to check ledger dues: ${window.location.href}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Visual Dynamic Island Header style matching S3 */}
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white pt-7 pb-20 px-4 rounded-b-[32px] shadow-md relative text-center">
        <span className="text-[10px] bg-white/20 text-indigo-100 px-3 py-1 rounded-full font-mono uppercase font-black">
          TxnBook dashboard
        </span>
        <h1 className="text-base font-black tracking-tight mt-2 font-sans uppercase">
          Personal Spending Insights
        </h1>
        <p className="text-[10px] text-indigo-100 font-sans mt-0.5">
          Weekly analytics of ledger assets
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 select-none relative z-10">
        
        {/* Quick Actions Header */}
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-sans px-1">
          Quick Actions Grid
        </span>

        {/* Action cards in a clean Bento Grid layout */}
        <div className="grid grid-cols-2 gap-3.5 mt-2">
          
          {/* Split a Bill card (Bento grid cell 1) */}
          <button
            onClick={onOpenSplitBill}
            className="col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col justify-between h-36 group cursor-pointer"
            id="split-bill-action-card"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg shadow-sm group-hover:scale-110 transition-transform">
              👥
            </div>
            <div>
              <h4 className="font-sans font-extrabold text-slate-900 dark:text-slate-100 text-xs tracking-tight leading-tight flex items-center justify-between">
                <span>Split Bill</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal font-sans">
                Divide dining or travel dues instantly
              </p>
            </div>
          </button>

          {/* Monthly Summary card (Bento grid cell 2) */}
          <button
            onClick={onOpenMonthlySummary}
            className="col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col justify-between h-36 group cursor-pointer"
            id="monthly-summary-action-card"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg shadow-sm group-hover:scale-110 transition-transform">
              📅
            </div>
            <div>
              <h4 className="font-sans font-extrabold text-slate-900 dark:text-slate-100 text-xs tracking-tight leading-tight flex items-center justify-between">
                <span>Summary</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal font-sans">
                Analyze ledger trends & balances
              </p>
            </div>
          </button>

          {/* New Social Share Action (Bento grid bottom banner) */}
          <div className="col-span-2 bg-gradient-to-br from-indigo-50/50 dark:from-slate-900 via-white dark:via-slate-900 to-indigo-100/10 dark:to-indigo-950/20 rounded-3xl border border-indigo-100/70 dark:border-slate-800 p-4.5 flex flex-col gap-2.5 mt-1 select-text shadow-sm">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-sans">Social peer-sharing link</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              Copy this personalized link to add family members to your ledger, or invite contacts instantly.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-[10px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none select-all shadow-inner"
              />
              <button
                onClick={copyQuickSplit}
                className="px-3 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
