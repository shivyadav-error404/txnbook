import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  QrCode, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight,
  Info,
  Users2,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Share2,
  Wallet,
  Coins,
  ChevronRight
} from 'lucide-react';
import { Friend, Transaction } from '../types';

interface CashbookInsightsProps {
  friends: Friend[];
  transactions: Transaction[];
  onAddTransaction: (txInput: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  onDeleteTransaction: (txId: string) => Promise<void>;
  onEditTransaction: (tx: Transaction) => void;
  onOpenSplitBill: () => void;
  onOpenMonthlySummary: () => void;
  currencySymbol: string;
  onResetSeeds: () => void;
}

export interface SettlementQRConfig {
  region: 'IN' | 'NP';
  payeeName: string;
  
  // Indian UPI
  upiId: string;
  bankName: string;
  accNumber: string;
  ifscCode: string;
  
  // Nepali Transfer
  nepalSystem: 'esewa' | 'khalti' | 'fonepay' | 'bank_transfer';
  walletId: string;
  nepalBankName: string;
  nepalAccNumber: string;
  nepalBranch: string;
  
  extraNote: string;
  colorTheme: 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'esewa_green' | 'khalti_purple' | 'fonepay_red';
  customQRImage?: string | null;
}

export default function CashbookInsights({
  friends,
  transactions,
  onOpenSplitBill,
  onOpenMonthlySummary,
  currencySymbol,
  onResetSeeds
}: CashbookInsightsProps) {
  // Local active sub-tab state - now supporting Analytics & Settlement QR
  const [panelTab, setPanelTab] = useState<'analytics' | 'payment-qr'>('analytics');
  
  // Bank QR states with persistent localstorage
  const [qrProfile, setQrProfile] = useState<SettlementQRConfig>(() => {
    const saved = localStorage.getItem('txnbook_payment_qr_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          region: parsed.region || 'IN',
          payeeName: parsed.payeeName || parsed.name || 'Shiv Kumar Yadav',
          upiId: parsed.upiId || 'shivyadav0344@okaxis',
          bankName: parsed.bankName || 'Axis Bank',
          accNumber: parsed.accNumber || parsed.accountNo || '921010045672910',
          ifscCode: parsed.ifscCode || 'UTIB0001245',
          nepalSystem: parsed.nepalSystem || 'esewa',
          walletId: parsed.walletId || '9841234567',
          nepalBankName: parsed.nepalBankName || 'Nabil Bank',
          nepalAccNumber: parsed.nepalAccNumber || '0100017500012',
          nepalBranch: parsed.nepalBranch || 'Kathmandu',
          extraNote: parsed.extraNote || 'Scan or copy details to settle our expenses',
          colorTheme: parsed.colorTheme || 'indigo',
          customQRImage: parsed.customQRImage || null
        };
      } catch (e) {
        // use fallback fallback
      }
    }
    return {
      region: 'IN',
      payeeName: 'Shiv Kumar Yadav',
      upiId: 'shivyadav0344@okaxis',
      bankName: 'Axis Bank',
      accNumber: '921010045672910',
      ifscCode: 'UTIB0001245',
      nepalSystem: 'esewa',
      walletId: '9841234567',
      nepalBankName: 'Nabil Bank',
      nepalAccNumber: '0100017500012',
      nepalBranch: 'Kathmandu',
      extraNote: 'Scan or copy details to settle our expenses',
      colorTheme: 'indigo',
      customQRImage: null
    };
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isEditingQR, setIsEditingQR] = useState(false);
  const [draftQR, setDraftQR] = useState<SettlementQRConfig>({ ...qrProfile });

  // Reset QR state draft when entering editing mode
  useEffect(() => {
    setDraftQR({ ...qrProfile });
  }, [qrProfile, isEditingQR]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftQR({ ...draftQR, customQRImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedImage = () => {
    setDraftQR({ ...draftQR, customQRImage: null });
  };

  // Save QR Profile
  const handleSaveQRProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate custom theme color override for specific brands in Nepal
    let themeToSave = draftQR.colorTheme;
    if (draftQR.region === 'NP') {
      if (draftQR.nepalSystem === 'esewa') themeToSave = 'esewa_green';
      else if (draftQR.nepalSystem === 'khalti') themeToSave = 'khalti_purple';
      else if (draftQR.nepalSystem === 'fonepay') themeToSave = 'fonepay_red';
    }
    const finalProfile = { ...draftQR, colorTheme: themeToSave };
    setQrProfile(finalProfile);
    localStorage.setItem('txnbook_payment_qr_config', JSON.stringify(finalProfile));
    setIsEditingQR(false);
  };

  const executeCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // derived friend calculations
  const totalGettingFromFriends = friends
    .filter(f => f.balance > 0)
    .reduce((sum, f) => sum + f.balance, 0);

  const totalOweToFriends = friends
    .filter(f => f.balance < 0)
    .reduce((sum, f) => sum + Math.abs(f.balance), 0);

  const ledgerNet = totalGettingFromFriends - totalOweToFriends;
  const activeDebtors = [...friends].filter(f => f.balance > 0).sort((a, b) => b.balance - a.balance);
  const activeCreditors = [...friends].filter(f => f.balance < 0).sort((a, b) => a.balance - b.balance);
  const activeAccountsCount = friends.filter(f => f.balance !== 0).length;

  // Generate QR code based on region selection
  const isNepal = qrProfile.region === 'NP';
  
  let qrPayload = '';
  if (!isNepal) {
    qrPayload = `upi://pay?pa=${qrProfile.upiId}&pn=${encodeURIComponent(qrProfile.payeeName)}&cu=INR`;
  } else {
    // Standard deep schemas for Nepal wallets representation
    if (qrProfile.nepalSystem === 'esewa') {
      qrPayload = `esewa://pay?id=${qrProfile.walletId}&name=${encodeURIComponent(qrProfile.payeeName)}`;
    } else if (qrProfile.nepalSystem === 'khalti') {
      qrPayload = `khalti://pay?phone=${qrProfile.walletId}&name=${encodeURIComponent(qrProfile.payeeName)}`;
    } else if (qrProfile.nepalSystem === 'fonepay') {
      qrPayload = `fonepay://pay?phone=${qrProfile.walletId}&merchantName=${encodeURIComponent(qrProfile.payeeName)}`;
    } else {
      qrPayload = `nepal-payment://transfer?acc=${qrProfile.nepalAccNumber}&bank=${encodeURIComponent(qrProfile.nepalBankName)}&name=${encodeURIComponent(qrProfile.payeeName)}`;
    }
  }

  const qrImageSrc = qrProfile.customQRImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(qrPayload)}`;

  // Copy full payment package
  const copyFullDetails = () => {
    if (!isNepal) {
      const details = `🇮🇳 Indian Payment Channels:\nName: ${qrProfile.payeeName}\nUPI ID: ${qrProfile.upiId}\nBank: ${qrProfile.bankName}\nA/C: ${qrProfile.accNumber}\nIFSC: ${qrProfile.ifscCode}\n--\nSettle using any standard UPI app.`;
      executeCopy(details, 'package');
    } else {
      const systemLabel = qrProfile.nepalSystem.toUpperCase();
      const details = `🇳🇵 Nepal Digital Settlement:\nName: ${qrProfile.payeeName}\nNetwork: ${systemLabel}\nWallet/Phone ID: ${qrProfile.walletId}\nBank Acc: ${qrProfile.nepalBankName}\nA/C No: ${qrProfile.nepalAccNumber}\nBranch: ${qrProfile.nepalBranch}\n--\nDirect transfer via eSewa / IME Khalti / Fonepay Mobile Banking.`;
      executeCopy(details, 'package');
    }
  };

  // QR Color theme configuration object
  const getThemeClasses = () => {
    const theme = qrProfile.colorTheme;
    switch (theme) {
      case 'esewa_green':
        return {
          bg: 'from-[#60bb46] to-[#489533]',
          text: 'text-[#60bb46] dark:text-[#7ce55e]',
          border: 'border-emerald-100 dark:border-emerald-900',
          lightBg: 'bg-[#60bb46]/10 dark:bg-[#60bb46]/5',
          badge: 'border-[#60bb46]/20 bg-[#60bb46]/10 text-[#2e5e1e] dark:text-[#a5f38e]'
        };
      case 'khalti_purple':
        return {
          bg: 'from-[#5c2d91] to-[#3a1d5c]',
          text: 'text-[#5c2d91] dark:text-[#9e5fe9]',
          border: 'border-purple-150 dark:border-[#5c2d91]/50',
          lightBg: 'bg-[#5c2d91]/15',
          badge: 'border-[#5c2d91]/20 bg-[#5c2d91]/10 text-[#5c2d91] dark:text-[#cdacf5]'
        };
      case 'fonepay_red':
        return {
          bg: 'from-[#e6302e] to-[#a4100e]',
          text: 'text-[#e6302e] dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-900',
          lightBg: 'bg-[#e6302e]/10',
          badge: 'border-[#e6302e]/20 bg-[#e6302e]/10 text-[#850b09] dark:text-rose-300'
        };
      case 'emerald':
        return {
          bg: 'from-emerald-600 to-teal-800',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-100 dark:border-indigo-950',
          lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
          badge: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:text-emerald-300'
        };
      case 'violet':
        return {
          bg: 'from-violet-600 to-purple-800',
          text: 'text-violet-600 dark:text-violet-400',
          border: 'border-violet-100 dark:border-violet-950',
          lightBg: 'bg-violet-50 dark:bg-violet-950/20',
          badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:text-violet-300'
        };
      case 'amber':
        return {
          bg: 'from-amber-500 to-orange-700',
          text: 'text-amber-600 dark:text-[#f59e0b]',
          border: 'border-amber-100 dark:border-amber-950',
          lightBg: 'bg-amber-50 dark:bg-amber-950/20',
          badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:text-amber-300'
        };
      case 'rose':
        return {
          bg: 'from-rose-600 to-pink-850',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-950',
          lightBg: 'bg-rose-50 dark:bg-rose-950/20',
          badge: 'border-rose-200 bg-rose-50 text-rose-700'
        };
      case 'indigo':
      default:
        return {
          bg: 'from-indigo-600 to-indigo-800',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-50 dark:border-indigo-950',
          lightBg: 'bg-indigo-50/70 dark:bg-indigo-950/25',
          badge: 'border-indigo-150 bg-indigo-50 text-indigo-700 dark:text-indigo-300'
        };
    }
  };

  const themeStyle = getThemeClasses();
  const colorsList = ['indigo', 'emerald', 'violet', 'amber', 'rose'] as const;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      
      {/* Visual Dynamic Island Header */}
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white pt-6 pb-20 px-4 rounded-b-[32px] shadow-sm relative text-center">
        <span className="text-[9px] bg-white/10 text-slate-100 px-3 py-1 rounded-full font-mono uppercase font-black tracking-wider">
          Unified Ledger & Settlement
        </span>
        <h1 className="text-base font-black tracking-tight mt-2 font-sans uppercase">
          Settle & Insights
        </h1>
        <p className="text-[10px] text-slate-205 font-sans mt-0.5">
          View deep ledger indicators and share dynamic Indian UPI / Nepali wallet settle codes
        </p>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-12 select-none relative z-10 flex-1 flex flex-col gap-4 pb-20">
        
        {/* Sliding Segmented Tab Switch */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl shadow-md flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPanelTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-wide transition-all ${
              panelTab === 'analytics' 
                ? 'bg-indigo-55 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400 font-black shadow-inner border border-indigo-100/30' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard Insights</span>
          </button>
          
          <button
            type="button"
            onClick={() => setPanelTab('payment-qr')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-wide transition-all ${
              panelTab === 'payment-qr' 
                ? 'bg-indigo-55 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400 font-black shadow-inner border border-indigo-100/30' 
                : 'text-slate-400 hover:text-slate-300 dark:hover:text-slate-350'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Settlement QR ({qrProfile.region === 'IN' ? '🇮🇳 IN' : '🇳🇵 NP'})</span>
          </button>
        </div>

        {/* ==================================== SUBTAB: ANALYTICS ==================================== */}
        {panelTab === 'analytics' && (
          <div className="flex flex-col gap-4 animate-bento-fade">
            
            {/* Quick Actions Bento Grid layout */}
            <div className="grid grid-cols-2 gap-3 pb-1">
              {/* Split a Bill action */}
              <button
                onClick={onOpenSplitBill}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
                id="split-bill-action-card"
              >
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/70 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg shadow-xs group-hover:scale-110 transition-all">
                  💸
                </div>
                <div>
                  <h4 className="font-sans font-black text-slate-900 dark:text-slate-100 text-xs tracking-tight leading-tight flex items-center justify-between">
                    <span>Split Bill Group</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                    Instantly divide items with multiple friends
                  </p>
                </div>
              </button>

              {/* Monthly Statement summaries */}
              <button
                onClick={onOpenMonthlySummary}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
                id="monthly-statement-action-card"
              >
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg shadow-xs group-hover:scale-110 transition-all">
                  🔮
                </div>
                <div>
                  <h4 className="font-sans font-black text-slate-900 dark:text-slate-100 text-xs tracking-tight leading-tight flex items-center justify-between">
                    <span>Monthly Audit</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                    Generate ledger statements & trends
                  </p>
                </div>
              </button>
            </div>

            {/* Smart Ledger Diagnostics & Insights (Extremely robust update) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase px-2 py-0.5 rounded-md inline-block">
                Net Exposure Analysis
              </span>
              
              <div className="mt-3.5 flex items-baseline justify-between select-text">
                <div>
                  <p className={`text-xl font-black font-mono leading-none ${ledgerNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {ledgerNet >= 0 ? '+' : ''}{currencySymbol}{ledgerNet.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-sans mt-1.5 uppercase tracking-wide">
                    {ledgerNet >= 0 ? '💰 Total Net Receivable' : '⚠️ Total Net Payable'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/40 px-2 py-1 rounded-xl">
                    {activeAccountsCount} Active {activeAccountsCount === 1 ? 'Ledger' : 'Ledgers'}
                  </span>
                </div>
              </div>

              {/* Progress visualizer box */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800/80 mt-4 pt-3 text-left">
                <div>
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-wide flex items-center gap-0.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Expecting (Receivables)</span>
                  </span>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {currencySymbol}{totalGettingFromFriends.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-wide flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                    <span>Owed (Liabilities)</span>
                  </span>
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                    {currencySymbol}{totalOweToFriends.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Graphical meter of debt ratio */}
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-3 rounded-full mt-4 border border-slate-50 dark:border-slate-850 overflow-hidden flex">
                {totalGettingFromFriends === 0 && totalOweToFriends === 0 ? (
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-850" />
                ) : (
                  <>
                    <div 
                      style={{ width: `${(totalGettingFromFriends / (totalGettingFromFriends + totalOweToFriends || 1)) * 100}%` }}
                      className="h-full bg-emerald-500 transition-all rounded-l-full"
                    />
                    <div 
                      style={{ width: `${(totalOweToFriends / (totalGettingFromFriends + totalOweToFriends || 1)) * 100}%` }}
                      className="h-full bg-rose-500 transition-all rounded-r-full"
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-semibold">
                <span>{totalGettingFromFriends > 0 ? `${Math.round((totalGettingFromFriends / (totalGettingFromFriends + totalOweToFriends || 1)) * 100)}% expects` : ''}</span>
                <span>{totalOweToFriends > 0 ? `${Math.round((totalOweToFriends / (totalGettingFromFriends + totalOweToFriends || 1)) * 100)}% owes` : ''}</span>
              </div>
            </div>

            {/* Smart Diagnostics Advisor */}
            <div className="p-4.5 bg-gradient-to-r from-indigo-50/40 via-white to-violet-50/10 dark:from-indigo-950/10 dark:to-slate-900 border border-indigo-50/60 dark:border-indigo-950/60 rounded-3xl text-left select-text">
              <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-wider">Dynamic Debtor Diagnostics</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-550 dark:text-slate-400 font-sans leading-relaxed space-y-1.5 font-medium">
                {activeDebtors.length > 0 ? (
                  <p>
                    📌 <strong className="text-slate-800 dark:text-white font-black">{activeDebtors[0].name}</strong> holds your largest outstanding receivable of <strong className="font-mono text-emerald-600 dark:text-emerald-450">{currencySymbol}{activeDebtors[0].balance.toLocaleString()}</strong>. Send them a professional settle request nudge!
                  </p>
                ) : (
                  <p>🎉 Nobody owes you anything currently. Clean records!</p>
                )}
                {activeCreditors.length > 0 && (
                  <p>
                    ⌛ You owe <strong className="text-slate-800 dark:text-white font-black">{activeCreditors[0].name}</strong> of <strong className="font-mono text-rose-500">{currencySymbol}{Math.abs(activeCreditors[0].balance).toLocaleString()}</strong>. Go to Settlement QR to display your payee coordinates or clear balances soon.
                  </p>
                )}
              </div>
            </div>

            {/* BENTO DIVISION 1: top expecting debtors (Top Receivables) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>●</span> Top Receivables (People owes you)
              </span>
              
              {activeDebtors.length === 0 ? (
                <p className="p-3 text-center text-[10px] text-slate-400 font-medium">No active receivables. Splendid!</p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {activeDebtors.slice(0, 4).map(f => (
                    <div key={f.id} className="py-2 flex items-center justify-between text-xs font-bold text-slate-705 dark:text-slate-350">
                      <span className="text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5">
                        <Users2 className="w-3 h-3 text-emerald-500" />
                        <span>{f.name}</span>
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-450">+{currencySymbol}{f.balance.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BENTO DIVISION 2: top liabilities (Top Payables) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <span>●</span> Top Payables (You owe people)
              </span>
              
              {activeCreditors.length === 0 ? (
                <p className="p-3 text-center text-[10px] text-slate-400 font-medium font-sans">You have no outstanding dues. Wonderful!</p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {activeCreditors.slice(0, 4).map(f => (
                    <div key={f.id} className="py-2 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5">
                        <Users2 className="w-3 h-3 text-rose-500" />
                        <span>{f.name}</span>
                      </span>
                      <span className="font-mono text-rose-500">-{currencySymbol}{Math.abs(f.balance).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global sharing ledger link */}
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-3xl flex flex-col gap-2.5">
              <div className="flex items-center gap-1 font-sans font-bold text-[10px] text-slate-500 dark:text-slate-405 uppercase tracking-wider">
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite Members to Ledger</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans -mt-0.5">
                Share this direct, secure link to invite peer debtors or suppliers to keep records together:
              </p>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-[9px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none select-all"
                />
                <button
                  onClick={() => executeCopy(window.location.href, 'link')}
                  className="px-3 text-[10px] font-black uppercase tracking-wider bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedText === 'link' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================================== SUBTAB: PAYMENT-QR ==================================== */}
        {panelTab === 'payment-qr' && (
          <div className="flex flex-col gap-4 animate-bento-fade">
            
            {!isEditingQR ? (
              // PREVIEW SCREEN FOR THE CUSTOM SETTLEMENT PAY CARD
              <div className="flex flex-col gap-4">
                
                {/* Custom Gradient Pay Card enclosing dynamically sized QR code */}
                <div className={`bg-gradient-to-br ${themeStyle.bg} p-6.5 rounded-3xl text-white shadow-xl relative text-center flex flex-col items-center justify-center gap-4 border border-white/10 transition-all`}>
                  
                  {/* Decorative badge indicating country and status */}
                  <div className="flex items-center gap-1.5 bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest shadow-inner">
                    <QrCode className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      {qrProfile.region === 'IN' ? '🇮🇳 India UPI Settle' : `🇳🇵 Nepal ${qrProfile.nepalSystem.toUpperCase()} Settle`}
                    </span>
                  </div>

                  {/* Rendered Scan QR block */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center relative border border-slate-100 mt-1">
                    <img 
                      src={qrImageSrc} 
                      alt="Payment Settle Code" 
                      className="w-44 h-44 cursor-pointer select-none mix-blend-multiply"
                    />
                  </div>

                  {/* Account detail descriptions */}
                  <div>
                    <h3 className="text-sm font-black tracking-wide font-sans mt-1 uppercase">
                      {qrProfile.payeeName}
                    </h3>
                    
                    {!isNepal ? (
                      <p className="text-[10px] text-white/95 font-mono mt-1 font-bold bg-white/10 px-2.5 py-0.5 rounded-md inline-block select-all">
                        upi: {qrProfile.upiId}
                      </p>
                    ) : (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <span className="text-[10px] text-white bg-black/25 px-2.5 py-1 rounded-md font-mono font-bold select-all">
                          ID ({qrProfile.nepalSystem.toUpperCase()}): {qrProfile.walletId}
                        </span>
                      </div>
                    )}

                    {/* Show corresponding Bank Account labels */}
                    {(!isNepal && qrProfile.bankName) && (
                      <p className="text-[9px] text-white/80 tracking-normal uppercase font-black mt-2">
                        {qrProfile.bankName} Account Coordinates
                      </p>
                    )}
                    {(isNepal && qrProfile.nepalBankName) && (
                      <p className="text-[9px] text-white/80 tracking-normal uppercase font-black mt-2">
                        🏦 {qrProfile.nepalBankName} ({qrProfile.nepalBranch || 'Nepal'})
                      </p>
                    )}
                  </div>

                  {/* Secondary info coordinates block */}
                  <div className="w-full bg-black/15 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 text-left text-[10px] font-medium font-sans">
                    {!isNepal ? (
                      <>
                        <div className="flex justify-between font-mono">
                          <span className="text-white/65">A/C Number:</span>
                          <span className="font-bold select-all">{qrProfile.accNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-white/65">IFSC Code:</span>
                          <span className="font-bold select-all">{qrProfile.ifscCode || 'N/A'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between font-mono">
                          <span className="text-white/65">Acc Name:</span>
                          <span className="font-bold select-all">{qrProfile.payeeName}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-white/65">A/C Number:</span>
                          <span className="font-bold select-all">{qrProfile.nepalAccNumber || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {qrProfile.extraNote && (
                    <p className="text-[9px] text-white/80 font-sans italic max-w-sm mt-0.5 leading-snug">
                      "{qrProfile.extraNote}"
                    </p>
                  )}
                </div>

                {/* Operations Actions bar */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <button
                    onClick={copyFullDetails}
                    className="py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>{copiedText === 'package' ? 'Copied Full text!' : 'Copy Settle coordinates'}</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditingQR(true)}
                    className="py-3.5 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 shadow-lg shadow-blue-500/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Edit Payment Config</span>
                  </button>
                </div>

                {/* Highly structured, descriptive instructions for Nepal & India settle */}
                <div className="p-4 bg-indigo-50/70 dark:bg-slate-900 border border-indigo-100/50 dark:border-slate-800 rounded-3xl text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed text-left space-y-2">
                  <div className="flex items-start gap-1.5 text-indigo-700 dark:text-indigo-400">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="font-black uppercase tracking-wide text-[9px] block">How Settlement Works</span>
                  </div>
                  <p className="font-medium">
                    This dynamically handles local standard clearing. Friends or clients can scan your displayed QR or click <strong className="font-bold">Copy Coordinates</strong> to instantly transfer split invoice payments.
                  </p>
                  {isNepal ? (
                    <div className="bg-white/80 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-[8px] uppercase tracking-wider block">🇳🇵 Nepal Digital Wallets info</span>
                      <p className="text-[9px] text-slate-550 dark:text-slate-400">
                        Peer transfers in Nepal use <strong className="font-bold">eSewa</strong> or <strong className="font-bold">IME Khalti</strong> IDs (10-digit mobile number) directly inside their apps. Setting these credentials generates the exact clearing layout.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/80 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                      <span className="font-black text-emerald-600 dark:text-emerald-450 text-[8px] uppercase tracking-wider block">🇮🇳 India UPI Standard info</span>
                      <p className="text-[9px] text-slate-550 dark:text-slate-400">
                        India uses the instant peer UPI protocols. Any standard mobile scanner (GPay, PhonePe, Paytm, BHIM) will resolve your UPI string automatically.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              // DYNAMIC FORM CONFIG FOR SETTLEMENTS
              <form onSubmit={handleSaveQRProfile} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-left animate-bento-fade">
                
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Setup Settlement Code</h3>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingQR(false)} 
                    className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Country Region selector */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-2">Select Payment Region</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setDraftQR({ ...draftQR, region: 'IN' })}
                      className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        draftQR.region === 'IN' 
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      🇮🇳 India (UPI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftQR({ ...draftQR, region: 'NP' })}
                      className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        draftQR.region === 'NP' 
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      🇳🇵 Nepal (eSewa/Fonepay)
                    </button>
                  </div>
                </div>

                {/* COMMON: Account / Payee Name */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">Registered Payee Name *</label>
                  <input 
                    type="text" 
                    required
                    value={draftQR.payeeName}
                    onChange={(e) => setDraftQR({ ...draftQR, payeeName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                    placeholder="Shiv Kumar Yadav"
                  />
                </div>

                {/* CUSTOM UPLOADED QR IMAGE (OPTIONAL) */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">Upload Custom QR Image (Optional)</label>
                  <p className="text-[9px] text-slate-500 mb-2">Supersedes generated QR codes. Helpful for native bank QR layouts (eSewa, NMB, IME Khalti).</p>
                  {draftQR.customQRImage ? (
                    <div className="relative inline-block border-2 border-dashed border-emerald-300 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                      <img src={draftQR.customQRImage} alt="Custom uploaded" className="w-24 h-24 rounded-lg object-contain mix-blend-multiply" />
                      <button 
                        type="button" 
                        onClick={clearUploadedImage}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 rounded-xl px-3 py-4 text-center text-[10px] font-bold hover:bg-slate-100 transition-colors flex flex-col items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-slate-400" />
                        <span>Tap to Upload Bank/Wallet QR Image</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DYNAMIC REGIONAL FIELDS: INDIA */}
                {draftQR.region === 'IN' ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">UPI ID * (For Auto-Scan QR)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. shivyadav0344@okaxis"
                        value={draftQR.upiId}
                        onChange={(e) => setDraftQR({ ...draftQR, upiId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">Bank Name</label>
                        <input 
                          type="text" 
                          value={draftQR.bankName}
                          onChange={(e) => setDraftQR({ ...draftQR, bankName: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                          placeholder="e.g. Axis Bank"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">Theme Accent</label>
                        <div className="flex gap-1.5 mt-1">
                          {colorsList.map(col => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setDraftQR({ ...draftQR, colorTheme: col })}
                              className={`w-5.5 h-5.5 rounded-full cursor-pointer transition-all ${
                                col === 'indigo' ? 'bg-indigo-600' :
                                col === 'emerald' ? 'bg-emerald-600' :
                                col === 'violet' ? 'bg-violet-600' :
                                col === 'amber' ? 'bg-amber-500' : 'bg-rose-600'
                              } ${draftQR.colorTheme === col ? 'ring-2 ring-slate-450 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Bank Account Number</label>
                        <input 
                          type="text" 
                          value={draftQR.accNumber}
                          onChange={(e) => setDraftQR({ ...draftQR, accNumber: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                          placeholder="e.g. 9210100456..."
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">IFSC Code</label>
                        <input 
                          type="text" 
                          value={draftQR.ifscCode}
                          onChange={(e) => setDraftQR({ ...draftQR, ifscCode: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                          placeholder="e.g. UTIB0001245"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // DYNAMIC REGIONAL FIELDS: NEPAL
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Select Primary Wallet / Network</label>
                      <select
                        value={draftQR.nepalSystem}
                        onChange={(e: any) => setDraftQR({ ...draftQR, nepalSystem: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-550 focus:outline-none cursor-pointer"
                      >
                        <option value="esewa">🟢 eSewa Direct Wallet</option>
                        <option value="khalti">🟣 IME Khalti Wallet ID</option>
                        <option value="fonepay">🔴 Fonepay Mobile Settle</option>
                        <option value="bank_transfer">🏦 Direct Bank Transfer (Nepal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">
                        Wallet ID / Phone Number *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 9841234567"
                        value={draftQR.walletId}
                        onChange={(e) => setDraftQR({ ...draftQR, walletId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold font-mono focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                      />
                      <span className="text-[8px] text-slate-400 block mt-1">
                        Use the 10-digit mobile number associated with your eSewa, IME Khalti or banking app.
                      </span>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-950/20 shadow-inner p-3 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Nepal Bank Transfer (Optional Backup)</span>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1">Bank Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Nabil Bank"
                            value={draftQR.nepalBankName}
                            onChange={(e) => setDraftQR({ ...draftQR, nepalBankName: e.target.value })}
                            className="w-full bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-205 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:ring-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1">Bank Branch</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Kathmandu"
                            value={draftQR.nepalBranch}
                            onChange={(e) => setDraftQR({ ...draftQR, nepalBranch: e.target.value })}
                            className="w-full bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 border border-slate-205 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:ring-1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1">Bank Account Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0100017500012"
                          value={draftQR.nepalAccNumber}
                          onChange={(e) => setDraftQR({ ...draftQR, nepalAccNumber: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-205 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* COMMON: Tagline note */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-405 tracking-wider mb-1.5">Custom Tagline / Direct Cash Msg</label>
                  <textarea 
                    value={draftQR.extraNote}
                    rows={2}
                    onChange={(e) => setDraftQR({ ...draftQR, extraNote: e.target.value })}
                    placeholder="e.g. Settle our combined splits or joint ledger debts seamlessly!"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 py-3.5 w-full bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
