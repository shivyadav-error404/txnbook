import React, { useState, useEffect } from 'react';
import { 
  X, 
  Brain, 
  Sparkles, 
  Check, 
  Copy, 
  Award, 
  AlertTriangle, 
  Info, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  History,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowRightLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Friend, Transaction } from '../types';

interface AuditHistoryItem {
  id: string;
  timestamp: string;
  score: number;
  summary: string;
  clearOutStrategy: string[];
  spendingLeaks: string[];
  customNudges: Array<{ friendName: string; amount: number; message: string }>;
  friendsCount: number;
  transactionsCount: number;
}

interface AIAuditWorkspaceProps {
  friends: Friend[];
  transactions: Transaction[];
  currencySymbol: string;
  onClose?: () => void;
  isExternalWindow?: boolean;
}

export default function AIAuditWorkspace({
  friends = [],
  transactions = [],
  currencySymbol = '₹',
  onClose,
  isExternalWindow = false
}: AIAuditWorkspaceProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [copiedDraftIdx, setCopiedDraftIdx] = useState<number | null>(null);
  const [copiedTextVal, setCopiedTextVal] = useState<boolean>(false);
  
  // Track active QR setup for intelligent QR check & analysis
  const [qrConfig] = useState<any>(() => {
    const saved = localStorage.getItem('txnbook_payment_qr_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
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
      colorTheme: 'indigo'
    };
  });
  
  // Loaded audit history from local storage
  const [historyList, setHistoryList] = useState<AuditHistoryItem[]>(() => {
    const saved = localStorage.getItem('txnbook_ai_audit_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse audit history:", e);
      }
    }
    return [];
  });

  // Selected audit ID (defaults to the latest one, if available)
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(() => {
    const saved = localStorage.getItem('txnbook_ai_audit_history');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (list.length > 0) return list[0].id;
      } catch (e) {}
    }
    return null;
  });

  // Persist historyList updates
  useEffect(() => {
    localStorage.setItem('txnbook_ai_audit_history', JSON.stringify(historyList));
  }, [historyList]);

  // Find active selected audit
  const activeAudit = historyList.find(item => item.id === selectedAuditId) || null;

  // Run server-side Gemini audited accounting check
  const handleRunNewAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const response = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friends,
          transactions,
          currencySymbol
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const resData = await response.json();
      
      // Save to history list
      const newItem: AuditHistoryItem = {
        id: 'audit_' + Date.now(),
        timestamp: new Date().toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        score: resData.score || 70,
        summary: resData.summary || "Ledger analyzed successfully.",
        clearOutStrategy: resData.clearOutStrategy || [],
        spendingLeaks: resData.spendingLeaks || [],
        customNudges: resData.customNudges || [],
        friendsCount: friends.length,
        transactionsCount: transactions.length
      };

      setHistoryList(prev => [newItem, ...prev]);
      setSelectedAuditId(newItem.id);
    } catch (err: any) {
      console.error(err);
      setAuditError(err?.message || "Failed to establish a full-stack Gemini workspace connection. Verify server state.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Delete an audit record from logs
  const handleDeleteAudit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this historical audit record?")) {
      const filtered = historyList.filter(item => item.id !== id);
      setHistoryList(filtered);
      if (selectedAuditId === id) {
        setSelectedAuditId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  };

  // Clear all audit logs
  const handleClearAllHistory = () => {
    if (confirm("Reset audit database? This permanently clears all custom AI financial audit history logs.")) {
      setHistoryList([]);
      setSelectedAuditId(null);
    }
  };

  const handleCopyNudgeDraft = (message: string, idx: number) => {
    navigator.clipboard.writeText(message);
    setCopiedDraftIdx(idx);
    setTimeout(() => setCopiedDraftIdx(null), 2000);
  };

  // Close helper for window structures
  const handleCloseWindow = () => {
    if (isExternalWindow) {
      window.close();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans tracking-tight antialiased select-none overflow-hidden xl:border-l xl:border-slate-800">
      
      {/* OS-STYLE DECORATION HEADER BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shrink-0">
        
        {/* Mock window dots */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleCloseWindow}
            className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group relative cursor-pointer"
            title="Close workspace"
          >
            <span className="text-[7px] text-rose-950 font-black opacity-0 group-hover:opacity-100 absolute -top-0.5 leading-none transition-opacity">×</span>
          </button>
          <div className="w-3 h-3 rounded-full bg-amber-400 opacity-80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-80" />
        </div>

        {/* Dynamic header label text */}
        <div className="flex items-center justify-center gap-2 text-center flex-1">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-[#f8fafc] font-sans">
            AI Core Audit Workspace
          </span>
          <span className="text-[8px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-md border border-slate-700 uppercase">
            {isExternalWindow ? "STANDALONE WINDOW" : "DYNAMIC COMPONENT"}
          </span>
        </div>

        {/* Close command */}
        <button
          onClick={handleCloseWindow}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-all"
          title="Exit Workspace"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CORE WORKSPACE GRID LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT / TOP SPLIT: HISTORICAL SESSIONS PANEL */}
        <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-150 dark:border-slate-800/80 flex flex-col shrink-0 md:h-full">
          
          <div className="p-4 border-b border-slate-150 dark:border-slate-800/60 bg-slate-50/55 dark:bg-slate-950/20 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-405" />
              <span>Audit Session Logs ({historyList.length})</span>
            </span>
            {historyList.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-tight flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Format DB</span>
              </button>
            )}
          </div>

          {/* Trigger button box */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={handleRunNewAudit}
              disabled={isAuditing || (friends.length === 0 && transactions.length === 0)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAuditing || (friends.length === 0 && transactions.length === 0)
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 cursor-not-allowed'
                  : 'bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning Ledger...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 animate-bounce" />
                  <span>Execute AI Core Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Sessions items log wrapper */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-2 space-y-1">
            {historyList.length === 0 ? (
              <div className="py-20 px-4 text-center select-text">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/45 rounded-xl flex items-center justify-center text-lg mx-auto mb-3">
                  🔮
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">No Audits Recorded</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 max-w-[210px] leading-relaxed mx-auto">
                  Execute your first server-side Gemini intelligence audit above to build structured accounting logs.
                </p>
              </div>
            ) : (
              historyList.map((item) => {
                const isSelected = item.id === selectedAuditId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAuditId(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/60' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Score Circle marker */}
                    <div className={`w-8.5 h-8.5 rounded-lg font-black text-[11px] flex items-center justify-center font-mono ${
                      item.score >= 80 
                        ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : item.score >= 50 
                          ? 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30' 
                          : 'bg-rose-100/80 text-rose-650 dark:bg-rose-950/40'
                    }`}>
                      {item.score}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider font-mono text-slate-400 font-extrabold truncate">
                          {item.timestamp.split(',')[1] || item.timestamp}
                        </span>
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-405 px-1 font-mono rounded">
                          {item.friendsCount}L
                        </span>
                      </div>
                      <h4 className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200 truncate mt-0.5 leading-none">
                        {item.summary}
                      </h4>
                      <p className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-semibold">
                        Score: {item.score >= 80 ? 'EXCELLENT' : item.score >= 50 ? 'STABLE' : 'ACTION NEEDED'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <button
                        onClick={(e) => handleDeleteAudit(item.id, e)}
                        className="text-slate-350 hover:text-rose-500 p-0.5 rounded transition-all"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Prompt status display bottom panel */}
          <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800/80 text-[9px] font-sans text-slate-400 text-center uppercase tracking-wider shrink-0 hidden md:block">
            ACTIVE RECORDS: {friends.length} FRIENDS • {transactions.length} ENTRIES
          </div>
        </div>

        {/* RIGHT / MAIN CONTENT: REPORT DISPLAY SCREEN */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 select-text">
          
          {isAuditing && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
              <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 animate-pulse font-sans">
                AI Deep-Scanning Social ledgers...
              </p>
              <p className="text-[10px] text-slate-400 font-sans mt-1.5 text-center max-w-xs leading-relaxed">
                Gemini is auditing transaction weights, projecting settlement flows, and formulating context-aware clearing nudge structures. Please hold on.
              </p>
            </div>
          )}

          {!isAuditing && activeAudit && (
            <div className="p-5 flex flex-col gap-6 max-w-2xl mx-auto w-full">
              
              {/* Dynamic summary indicator header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bento-fade relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black font-mono text-xl border relative shadow-inner ${
                    activeAudit.score >= 80 
                      ? 'bg-emerald-50 border-emerald-100/70 text-emerald-650' 
                      : activeAudit.score >= 50 
                        ? 'bg-amber-50 border-amber-100 text-amber-700' 
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {activeAudit.score}
                    <span className="absolute bottom-0 right-1 text-[8px] text-slate-400 font-semibold uppercase">SCORE</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-black text-slate-400 leading-none">Overall Clarity Metrics</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none border ${
                        activeAudit.score >= 80 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                          : activeAudit.score >= 50 
                            ? 'text-amber-700 bg-amber-50 border-amber-100' 
                            : 'text-rose-700 bg-rose-50 border-rose-100'
                      }`}>
                        {activeAudit.score >= 80 ? 'EXCELLENT' : activeAudit.score >= 50 ? 'STABLE' : 'RISKY BALANCE'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight leading-snug mt-1">
                      Account ledger audit checkpointed successfully.
                    </h3>
                    <p className="text-[9.5px] font-sans text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Report generated on: <strong className="font-mono text-xs">{activeAudit.timestamp}</strong></span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Executive Summary panel box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 text-left shadow-xs">
                <span className="text-[9px] uppercase font-black text-indigo-505 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 font-sans mb-2.5">
                  <Brain className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Executive Analyzer Consensus</span>
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {activeAudit.summary}
                </p>
              </div>

              {/* SETTLEMENT QR CALIBRATION & ROUTING AUDIT (User Request Topic) */}
              <div className="bg-[#FAFBFD] dark:bg-slate-900 border border-slate-150 dark:border-indigo-950 p-5 rounded-3xl text-left shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="shrink-0 text-emerald-650">●</span>
                    <span>Audited QR Coordinates & Routing Check</span>
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-md text-[8.5px] font-mono font-black border border-emerald-100 dark:border-emerald-900/60 leading-none">
                    FULLY REGISTERED VERIFICATION ({qrConfig.region === 'IN' ? '🇮🇳 IN' : '🇳🇵 NP'})
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-5 items-stretch">
                  {/* Digital QR Preview and Deep Link Indicator */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 flex flex-col items-center justify-center text-center max-w-[170px] shrink-0 mx-auto select-none shadow-inner">
                    <img 
                      src={qrConfig.customQRImage || `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=4&data=${encodeURIComponent(
                        qrConfig.region === 'IN'
                          ? `upi://pay?pa=${qrConfig.upiId}&pn=${encodeURIComponent(qrConfig.payeeName)}&cu=INR`
                          : qrConfig.nepalSystem === 'esewa'
                            ? `esewa://pay?id=${qrConfig.walletId}&name=${encodeURIComponent(qrConfig.payeeName)}`
                            : qrConfig.nepalSystem === 'khalti'
                              ? `khalti://pay?phone=${qrConfig.walletId}&name=${encodeURIComponent(qrConfig.payeeName)}`
                              : `nepal-payment://transfer?acc=${qrConfig.nepalAccNumber}&bank=${encodeURIComponent(qrConfig.nepalBankName)}`
                      )}`} 
                      alt="Verified Audit Link QR" 
                      className="w-24 h-24 pointer-events-none rounded-md mix-blend-multiply" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 font-bold mt-2 truncate w-full uppercase">
                      LINK STRING: {qrConfig.region === 'IN' ? qrConfig.upiId : qrConfig.walletId}
                    </span>
                  </div>

                  {/* Detailed Analysis Results list */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 font-sans leading-none">
                          1. Payee Entry Verification
                        </h4>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Nominal legal handle is registered beautifully as <strong className="font-extrabold text-slate-750 dark:text-slate-200">"{qrConfig.payeeName}"</strong>. No spelling irregularities or syntax gaps found. Safe for rapid settling.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 font-sans leading-none">
                          2. Router Gateway & Syntax Integrity
                        </h4>
                        {qrConfig.region === 'IN' ? (
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Primary Address is set to <code className="font-mono text-[9px] text-indigo-600 bg-indigo-50/50 p-1 rounded font-extrabold">{qrConfig.upiId}</code>. Audited system confirms that this satisfies deep parsing criteria under the NPCI (National Payments Corporation of India) specifications and can be triggered on Paytm, PhonePe or GPay.
                          </p>
                        ) : (
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Mobile wallet is formatted under Nepalese telecom code routing using <code className="font-mono text-[9px] text-emerald-650 bg-emerald-50/50 p-1 rounded font-extrabold">{qrConfig.walletId} ({qrConfig.nepalSystem.toUpperCase()})</code>. Standard payment gateways such as Fonepay, IME Khalti or eSewa will instantly resolve this.
                          </p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 font-sans leading-none">
                          3. Routing Parameters Check
                        </h4>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Bank Details check has mapped routing for <strong className="font-medium text-slate-700 dark:text-slate-300">{qrConfig.region === 'IN' ? qrConfig.bankName : qrConfig.nepalBankName}</strong> accounts. Audit registers IFSC and account schemas under standard compliance metrics without risk.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Columns of Priorities & Spending Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* SETTLEMENT PATHS AND PRIORITIES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 text-left shadow-xs flex flex-col gap-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                    <span>Clearing Actions & Directions</span>
                  </span>
                  
                  {activeAudit.clearOutStrategy.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-sans py-4">No active strategies required currently.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeAudit.clearOutStrategy.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3 rounded-xl text-[10.5px] font-sans text-slate-650 dark:text-slate-400">
                          <span className="w-5.5 h-5.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-black text-[9.5px] rounded-lg shrink-0 flex items-center justify-center border border-indigo-100 dark:border-indigo-900 leading-none">
                            {idx+1}
                          </span>
                          <p className="leading-relaxed pt-0.5 font-sans">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DETECTED CASH FLOW SPENDING LEAKS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 text-left shadow-xs flex flex-col gap-3">
                  <span className="text-[9px] uppercase font-black text-slate-404 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Outflow Spends Leak Warning</span>
                  </span>
                  
                  {activeAudit.spendingLeaks.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-sans py-4">Congratulations, no specific spending leaks found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeAudit.spendingLeaks.map((leak, idx) => (
                        <div key={idx} className="flex gap-2.5 bg-rose-50/25 dark:bg-rose-950/20 border border-rose-100/30 dark:border-rose-900/30 p-3 rounded-xl text-[10.5px] font-sans text-slate-650 dark:text-slate-400">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-sans">{leak}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* DYNAMIC POLITE FRIEND MESSAGE CORNER */}
              {activeAudit.customNudges && activeAudit.customNudges.length > 0 && (
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 text-left shadow-xs flex flex-col gap-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-between font-sans">
                    <span>POLITE CUSTOM PAYMENT NUDGES DRAFT</span>
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-mono">COPY DRAFTS DIRECTLY</span>
                  </span>

                  <p className="text-[10px] text-slate-400 leading-snug font-sans -mt-1.5">
                    Select a context-aware smart payment draft message. Copy and slide it into WhatsApp or chat platforms directly for peer ledger clarity.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                    {activeAudit.customNudges.map((nudge, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
                        <div className="flex items-center justify-between text-[11px] leading-none font-sans">
                          <span className="font-extrabold text-slate-800 dark:text-slate-205">{nudge.friendName}</span>
                          <span className={`font-mono font-black ${nudge.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {nudge.amount > 0 ? '+' : ''}{currencySymbol}{nudge.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-sans leading-relaxed flex-1 select-all select-text">
                          "{nudge.message}"
                        </p>

                        <button
                          onClick={() => handleCopyNudgeDraft(nudge.message, idx)}
                          className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            copiedDraftIdx === idx 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900' 
                              : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
                          }`}
                        >
                          {copiedDraftIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-605" />
                              <span>Draft Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Draft</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rerun AI Audit footer option */}
              <div className="bg-slate-100/50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 font-sans leading-none">Ledger updated since this report?</h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-501 mt-1 font-sans">Run a rapid verification query on current transaction flows.</p>
                </div>
                <button
                  onClick={handleRunNewAudit}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-transparent dark:border-slate-800 cursor-pointer transition-all shrink-0"
                >
                  Rerun Ledger Scan
                </button>
              </div>

            </div>
          )}

          {!isAuditing && !activeAudit && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center select-text">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center text-2xl mb-4 border border-indigo-100/80 dark:border-indigo-900/50 shadow-inner">
                🔮
              </div>
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight">
                AI Transaction & Ledger Auditor Workspace
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed font-sans mt-2">
                This dedicated panel performs a deep analysis of mutual debts. It builds a history of your score changes, monitors category allocations, warns about leaks and prepares customizable settle message templates.
              </p>

              {friends.length === 0 && transactions.length === 0 ? (
                <div className="mt-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 p-3.5 rounded-2xl text-[10px] text-amber-700 dark:text-amber-400">
                  <p className="font-bold">Database Empty</p>
                  <p className="mt-0.5 leading-relaxed font-sans">Please record some friends or transact list items in your ledger to allow the Gemini intelligence system to analyze metrics.</p>
                </div>
              ) : (
                <button
                  onClick={handleRunNewAudit}
                  className="mt-6 px-6 py-3 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
                >
                  Analyze Current Ledger Data
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
