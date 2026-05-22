'use client';
import React from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, Rocket, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onLoadMoney?: () => void;
  onSettings?: () => void;
}

export const Navbar = ({ onLoadMoney, onSettings }: NavbarProps) => {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-4 z-50 mx-4 md:mx-8 mb-6 nm-flat px-4 md:px-8 py-3.5 rounded-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[-3px_-3px_8px_rgba(255,255,255,0.06),_3px_3px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-200">
            <Rocket className="text-white animate-pulse" size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black text-white leading-none tracking-tight hidden sm:block">Boost Manager</h1>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-1 hidden sm:block">Command Center</span>
          </div>
          <h1 className="text-base font-black text-white leading-none tracking-tight sm:hidden">BM</h1>
        </Link>
        
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 nm-inset rounded-xl px-3.5 py-1.5 border border-emerald-500/10 transition-all duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">Wallet</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 leading-none mt-0.5">
                  रू{(profile.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-black/40 shadow-[1px_0_0_rgba(255,255,255,0.03)] mx-1 hidden md:block"></div>

          <div className="flex items-center gap-2">
            {profile && (
              <div className="hidden md:flex items-center gap-2.5 nm-flat rounded-xl px-3 py-1.5 border border-white/5">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-zinc-100 leading-none mb-0.5">{profile.username}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${profile.role === 'Admin' ? 'text-amber-400' : 'text-indigo-400'}`}>{profile.role}</span>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${profile.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner'}`}>
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-icon"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {onSettings && (
              <button 
                onClick={onSettings}
                className="btn-icon"
                title="Profile Settings"
              >
                <UserIcon size={16} />
              </button>
            )}

            <button 
              onClick={() => signOut()}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#1A1C1E] text-rose-400 hover:text-rose-300 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-[-4px_-4px_12px_rgba(255,255,255,0.04),_4px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[-5px_-5px_15px_rgba(255,255,255,0.06),_5px_5px_15px_rgba(0,0,0,0.6)] border border-rose-500/20 active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)]"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
