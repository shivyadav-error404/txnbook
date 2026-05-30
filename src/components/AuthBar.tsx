import React, { useState } from 'react';
import { Cloud, CloudOff, Check, Copy, Share2, LogIn, LogOut, User as UserIcon, Link } from 'lucide-react';
import { isFirebaseConfigured, loginWithGoogle, logoutUser, auth } from '../lib/firebase';

interface AuthBarProps {
  user: any | null;
  onUserChange: (user: any | null) => void;
  onResetData?: () => void;
}

export default function AuthBar({ user, onUserChange, onResetData }: AuthBarProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleLogin = async () => {
    try {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onUserChange(null);
    } catch (err) {
      console.error(err);
    }
  };

  const shareApp = () => {
    setSharing(true);
    const text = `Join my Personal Ledger! Manage split bills and expenses together seamlessly. Watch your ledger online: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Personal Ledger - myKhata',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setTimeout(() => setSharing(false), 1000);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-850 px-4 py-3 sm:px-6 transition-colors duration-300">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Connection Status & User Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-green-500 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-slow"></span>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Google Sync Live</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/45 flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                <CloudOff className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-none">Local Mode</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">Cloud backup pending</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons / Actions */}
        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={shareApp}
            className="p-1.5 rounded-lg text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-405 hover:bg-gray-100 dark:hover:bg-slate-850 transition-all flex items-center gap-1 text-xs font-medium"
            title="Share with friends"
            id="share-app-btn"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-slate-705 dark:text-slate-300">Invite Friend</span>
              </>
            )}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-all flex items-center gap-1.5"
              id="sign-out-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white font-medium text-xs rounded-lg shadow-sm shadow-blue-500/20 hover:shadow transition-all flex items-center gap-1.5"
              id="google-sync-btn"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Backup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
