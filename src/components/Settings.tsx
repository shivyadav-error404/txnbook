import React, { useState } from 'react';
import { 
  Coins, 
  Cloud, 
  CloudOff, 
  Check, 
  Copy, 
  Share2, 
  LogIn, 
  LogOut, 
  Users2, 
  Info, 
  Sparkles,
  Heart,
  Download,
  Brain,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Award,
  Sun,
  Moon,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { isFirebaseConfigured, loginWithGoogle, logoutUser } from '../lib/firebase';
import { Friend, Transaction } from '../types';

interface SettingsProps {
  user: any | null;
  onUserChange: (user: any | null) => void;
  currencySymbol: string;
  onCurrencyChange: (symbol: string) => void;
  friends: Friend[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuditOverlay: () => void;
}

export const FAMOUS_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', flag: '🇳🇵' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '👑' },
];

export default function Settings({ 
  user, 
  onUserChange, 
  currencySymbol, 
  onCurrencyChange,
  friends = [],
  transactions = [],
  isDarkMode = false,
  onToggleDarkMode,
  onOpenAuditOverlay
}: SettingsProps) {
  const [inviteCopied, setInviteCopied] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isCurrencyExpanded, setIsCurrencyExpanded] = useState(false);
  
  // Load and refresh the latest audit summary info
  const [latestAudit, setLatestAudit] = useState<{ score: number; timestamp: string; summary: string } | null>(() => {
    const saved = localStorage.getItem('txnbook_ai_audit_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return {
            score: parsed[0].score,
            timestamp: parsed[0].timestamp,
            summary: parsed[0].summary
          };
        }
      } catch (e) {}
    }
    return null;
  });

  // Track window popup errors/blocker states
  const [popupBlockedMsg, setPopupBlockedMsg] = useState<string | null>(null);


  const handleLogin = async () => {
    try {
      setSyncStatusMsg(null);
      if (isFirebaseConfigured) {
        const loggedUser = await loginWithGoogle();
        if (loggedUser) {
          onUserChange(loggedUser);
        }
      } else {
        // Fallback simulated login
        const mockUser = {
          uid: 'mock_user_123',
          displayName: 'Shiv Kumar',
          email: 'shivyadav0344@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
        };
        onUserChange(mockUser);
        setSyncStatusMsg("Successfully entered cloud backup mode (Simulated)!");
      }
    } catch (err: any) {
      console.warn("Google Auth failed or was restricted inside the sandbox container environment:", err);
      // Failover automatically to simulated cloud backup to keep user sandbox and testing functional
      const mockUser = {
        uid: 'demo_sandbox_user_123',
        displayName: 'Shiv Kumar (Demo Sync)',
        email: 'shivyadav0344@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
      };
      onUserChange(mockUser);
      setSyncStatusMsg("Live Google login is blocked inside the restricted browser iframe. Activated Simulated Cloud Backup mode successfully!");
    }
  };

  const handleLogout = async () => {
    try {
      setSyncStatusMsg(null);
      await logoutUser();
      onUserChange(null);
      setSyncStatusMsg("Switched successfully to offline Local Mode.");
    } catch (err) {
      console.error(err);
    }
  };

  const inviteText = `Keep track of your mutual ledger, expenses, and split bills cleanly on TxnBook! Try it here: ${window.location.origin}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteText);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TxnBook - Shared Ledger',
        text: inviteText,
        url: window.location.origin,
      }).catch(console.error);
    } else {
      handleCopyInvite();
    }
  };

  // Export Entire Ledger & Transactions to a single CSV format cleanly
  const handleExportCSV = () => {
    // Generate simple, robust, well-formatted CSV content
    let csvContent = "\uFEFF"; // Byte Order Mark for Excel UTF-8 support
    
    // Ledger summary
    csvContent += "=== TXNBOOK LEDGER SUMMARY ===\n";
    csvContent += "Friend Name,Phone,Current Balance,Status,Last Activity Text\n";
    friends.forEach(f => {
      const escapedName = `"${f.name.replace(/"/g, '""')}"`;
      const escapedPhone = `"${(f.phone || '').replace(/"/g, '""')}"`;
      const escapedActivity = `"${(f.lastActivityText || '').replace(/"/g, '""')}"`;
      const statusText = f.balance > 0 ? "Owed (You Get)" : f.balance < 0 ? "Owes (You Give)" : "Settled (Nil)";
      csvContent += `${escapedName},${escapedPhone},${f.balance},${statusText},${escapedActivity}\n`;
    });
    
    csvContent += "\n\n";
    
    // Transactions section
    csvContent += "=== TRANSACTION RECORDS ===\n";
    csvContent += "Date,Type,Amount,Associated Ledger / Friend,Category,Payment Mode,Is Split Bill,Notes\n";
    transactions.forEach(tx => {
      const isoDate = new Date(tx.date).toLocaleDateString('en-IN') + ' ' + new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const typeLabel = tx.type === 'gave' ? "I Gave" : "I Got";
      const relatedFriend = tx.friendId ? (friends.find(f => f.id === tx.friendId)?.name || "Unknown Friend") : "Personal Entry / Out of P2P";
      const escapedCategory = `"${(tx.category || '').replace(/"/g, '""')}"`;
      const escapedNote = `"${(tx.note || '').replace(/"/g, '""')}"`;
      const isSplitStr = tx.isSplit ? "Yes" : "No";
      csvContent += `"${isoDate}","${typeLabel}",${tx.amount},"${relatedFriend}",${escapedCategory},"${tx.paymentMode}","${isSplitStr}",${escapedNote}\n`;
    });
    
    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TxnBook_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto w-full select-none max-h-[90vh] dark:text-slate-100 transition-colors duration-300 flex flex-col">
      
      {/* Visual Dynamic Island Header matching Settle/Dashboard look */}
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white pt-6 pb-20 px-4 rounded-b-[32px] shadow-sm relative text-center shrink-0">
        <span className="text-[9px] bg-white/10 text-slate-100 px-3 py-1 rounded-full font-mono uppercase font-black tracking-wider">
          System Panel
        </span>
        <h1 className="text-base font-black tracking-tight mt-2 font-sans uppercase">
          App Settings
        </h1>
        <p className="text-[10px] text-slate-200 font-sans mt-0.5">
          Personalize currency, backup state and run intelligent audit scans
        </p>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-12 select-none relative z-10 flex flex-col gap-4 pb-24">
        
        {/* PROFILE SECTION */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col gap-4 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">TxnBook</span>
                )}
              </div>
              <div>
                <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {user ? (user.displayName || 'TxnBook User') : 'Guest Account'}
                </h3>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                  {user ? (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-500" />
                      <span>{user.email || 'Cloud Google Backup'}</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3 text-amber-500" />
                      <span>Local Device Mode</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {!user ? (
              <button
                onClick={handleLogin}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all cursor-pointer shadow-sm border border-indigo-100 dark:border-indigo-900 flex flex-col items-center justify-center min-w-[52px]"
                title="Backup with Google"
                id="activate-backup-btn"
              >
                <LogIn className="w-4 h-4 mb-0.5" />
                <span className="text-[7px] font-black uppercase tracking-widest">Google</span>
              </button>
            ) : (
             <button
                onClick={handleLogout}
                className="p-2.5 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 flex flex-col items-center justify-center min-w-[52px]"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mb-0.5" />
                <span className="text-[7px] font-black uppercase tracking-widest">Logout</span>
              </button>
            )}
          </div>

          {!user && (
            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans md:mt-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              Logging into your Google Account activates automated background cloud backups of your friend lists and ledger entries.
            </p>
          )}

          {syncStatusMsg && (
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] font-sans text-indigo-700 dark:text-indigo-400 flex items-center gap-2 animate-bento-fade">
               <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{syncStatusMsg}</span>
            </div>
          )}
        </div>

        {/* SECTION 1: SELECTED CURRENCY - COLLAPSIBLE MENU LIST OPTION */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsCurrencyExpanded(!isCurrencyExpanded)}
            className="w-full text-left p-4.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center">
                {currencySymbol}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans leading-none">Primary Currency Selector</h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                  Active format: {FAMOUS_CURRENCIES.find(c => c.symbol === currencySymbol)?.name || 'Default'} ({currencySymbol})
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-mono">
                {FAMOUS_CURRENCIES.find(c => c.symbol === currencySymbol)?.flag || '🌍'} {currencySymbol}
              </span>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCurrencyExpanded ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {isCurrencyExpanded && (
            <div className="px-4.5 pb-4.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/60 flex flex-col gap-2 bg-slate-50/20 dark:bg-slate-950/20 animate-bento-fade">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mb-1">
                Select your local currency code. This dynamically formats all ledger activities, stats summaries, and split shares automatically throughout ledger indices.
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {FAMOUS_CURRENCIES.map((cur) => {
                  const isSelected = currencySymbol === cur.symbol;
                  return (
                    <button
                      type="button"
                      key={cur.code}
                      onClick={() => onCurrencyChange(cur.symbol)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-subtle-indigo' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{cur.flag}</span>
                        <div>
                          <h4 className="text-[11px] font-extrabold text-slate-850 dark:text-slate-200 font-sans leading-none">{cur.name}</h4>
                          <p className="text-[8px] text-slate-400 mt-1 font-mono">{cur.code}</p>
                        </div>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center transition-all ${
                        isSelected ? 'bg-blue-500/80 backdrop-blur-md border border-blue-400/30 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-850 text-slate-500 border border-slate-100 dark:border-slate-800'
                      }`}>
                        {cur.symbol}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* THEME CUSTOMIZATION: GLOBAL DARK MODE */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Theme Configuration</span>
            <span className="text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 rounded-md text-[9px] font-mono font-black">
              {isDarkMode ? "DARK MODE" : "LIGHT MODE"}
            </span>
          </h3>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans mb-3.5">
            Activate the high-contrast dark bento-grid layout using deep slate backgrounds with intense indigo accents for absolute visual comfort in low-light environments.
          </p>

          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl cursor-pointer shadow-sm transition-all duration-300 border ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-white' 
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </span>
            </div>
            
            {/* iOS style toggle */}
            <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${
              isDarkMode ? 'bg-blue-500/80 backdrop-blur-md border border-blue-400/30 shadow-sm shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-300 transform ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </button>
        </div>

        {/* SECTION 2: REMOVED (Merged into Profile overhead) */}

        {/* SECTION FOR CSV EXPORT */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Export & Accounting</span>
            <span className="text-[9px] font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-md">
              CSV SPREADSHEET
            </span>
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans mb-3.5">
            Download your complete social ledger summaries and chronological cashbook entries as a standard UTF-8 CSV spreadsheet for backup, taxes, or personal bookkeeping in Excel or Google Sheets.
          </p>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-slate-950 text-white hover:bg-slate-800 dark:hover:bg-black text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer shadow-sm transition-all border border-transparent dark:border-slate-800"
          >
            <Download className="w-4 h-4" />
            <span>Export Ledger as CSV</span>
          </button>
        </div>

        {/* SECTION FOR AI LEDGER AUDIT */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none font-sans">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>AI Ledger Auditor</span>
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans mb-3.5">
            Audits balances, predicts settlement priorities, detects cash leaks, and drafts polite, personalized nudge notes dynamically based on your friend transaction history.
          </p>

          {/* SATELLITE QUICK STATS */}
          {latestAudit ? (
            <div className="mb-4 p-3 bg-indigo-50/40 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-indigo-900/40 rounded-2xl text-left">
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-wider font-mono font-black text-indigo-600 dark:text-indigo-400">
                  Last Active Checkpoint
                </span>
                <span className="text-[8px] font-mono text-slate-450 dark:text-slate-500 font-extrabold">
                  {latestAudit.timestamp.split(',')[1] || latestAudit.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10.5px] text-slate-650 dark:text-slate-300 truncate pr-4 font-sans font-medium">
                  {latestAudit.summary}
                </p>
                <div className={`text-[10px] font-mono font-black shrink-0 px-2 py-0.5 rounded ${
                  latestAudit.score >= 80 
                    ? 'text-emerald-700 bg-emerald-55 border-emerald-100' 
                    : latestAudit.score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-rose-650 bg-rose-50'
                }`}>
                  {latestAudit.score}/100
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3.5 bg-slate-50/40 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-left">
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-sans text-center">
                🔮 No past audits indexed. Run your first intelligent ledger scan!
              </p>
            </div>
          )}

          {/* DUAL ACTION SYSTEM */}
          <div className="flex flex-col gap-2">
            {/* Action 1: Standalone Browser Window */}
            <button
              onClick={() => {
                const auditUrl = window.location.origin + window.location.pathname + '?window=audit';
                const openWin = window.open(auditUrl, 'txnbook_audit', 'width=1100,height=850,menubar=no,status=no,toolbar=no,scrollbars=yes');
                if (!openWin || openWin.closed || typeof openWin.closed === 'undefined') {
                  // Fallback if blocked
                  setPopupBlockedMsg("Safari/Chrome popup blocker blocked opening a separate window. Launching in-page overlay instead...");
                  setTimeout(() => {
                    setPopupBlockedMsg(null);
                    onOpenAuditOverlay();
                  }, 2200);
                } else {
                  setPopupBlockedMsg(null);
                }
              }}
              disabled={friends.length === 0 && transactions.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
                friends.length === 0 && transactions.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
                  : 'bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Audit (Separate Window)</span>
            </button>

            {/* Action 2: Embedded Page Overlay */}
            <button
              onClick={() => {
                setPopupBlockedMsg(null);
                onOpenAuditOverlay();
              }}
              disabled={friends.length === 0 && transactions.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer border ${
                friends.length === 0 && transactions.length === 0
                  ? 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-550 border-transparent cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-755 dark:text-slate-350'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Audit Workspace Here</span>
            </button>
          </div>

          {popupBlockedMsg && (
            <p className="mt-3 text-[9.5px] italic text-amber-600 dark:text-amber-400 font-sans leading-relaxed text-center font-medium animate-pulse">
              ⚠️ {popupBlockedMsg}
            </p>
          )}
        </div>

        {/* SECTION 3: INVITE FRIENDS */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Spread the Word</span>
            <span className="text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded-md text-[9px] font-mono font-black">
              INVITE ACTIVE
            </span>
          </h3>

          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans leading-none">
            Invite Friends & Family
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-2.5 mb-4">
            Keep your shared expenses and split bills accurate. Send a custom checkout link so they can check ledger summaries easily!
          </p>

          <div className="flex gap-2.5">
            <button
              onClick={handleCopyInvite}
              className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              {inviteCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Invite</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareInvite}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs animate-none"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: VERSION INFO */}
        <div className="flex flex-col items-center justify-center py-2.5">
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <span>TxnBook v1.2</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-rose-400">
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span>Nepalix Tech</span>
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}
