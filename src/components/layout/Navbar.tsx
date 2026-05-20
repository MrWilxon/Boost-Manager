import React from 'react';
import { LogOut, User as UserIcon, Rocket, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ 
  balance, 
  onLoadMoney, 
  onSettings
}: { 
  balance: number; 
  onLoadMoney: () => void;
  onSettings: () => void;
}) => {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 py-4 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <Rocket className="text-white fill-white/20" size={20} />
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-zinc-100 leading-none tracking-tight hidden sm:block">Boost Manager</h1>
          <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 leading-none tracking-tight sm:hidden">BM</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="flex flex-col items-end mr-1 sm:mr-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-none mb-1">Balance</p>
            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-none tracking-tighter">रू{balance.toLocaleString()}</p>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end hidden md:flex">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-none mb-1">{profile?.username}</span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-none">{profile?.role}</span>
             </div>
             <button 
               onClick={onSettings}
               className="p-2 text-slate-500 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
               title="Profile Settings"
             >
               <UserIcon size={18} />
             </button>
             <button 
               onClick={() => signOut()}
               className="p-2 text-slate-500 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
               title="Sign Out"
             >
               <LogOut size={18} />
             </button>
          </div>

          {profile?.role === 'User' && (
            <button 
              onClick={onLoadMoney}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center gap-2"
            >
              <CreditCard size={16} className="hidden sm:block" />
              Load
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
