'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, Rocket, Sun, Moon, Menu, X, Shield, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { useRouter, usePathname } from 'next/navigation';

interface NavbarProps {
  onLoadMoney?: () => void;
  onSettings?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoadMoney, onSettings }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isAdminPage = pathname?.startsWith('/admin');

    return (
    <header className="sticky top-4 z-50 mx-4 md:mx-8 mb-6 nm-flat px-4 md:px-8 py-3.5 rounded-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[-3px_-3px_8px_rgba(255,255,255,0.06),_3px_3px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-200">
            <Rocket className="text-white animate-pulse" size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black text-main leading-none tracking-tight hidden sm:block">Boost Manager</h1>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-1 hidden sm:block">Command Center</span>
          </div>
          <h1 className="text-base font-black text-main leading-none tracking-tight sm:hidden">BM</h1>
        </Link>
        
        <div className="flex items-center gap-3">
          {profile && (
            <div className="tour-step-wallet flex items-center gap-1.5 sm:gap-2 nm-inset rounded-xl px-2.5 py-1 sm:px-3.5 sm:py-1.5 border border-emerald-500/10 transition-all duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest leading-none hidden sm:block">Wallet</span>
                <span className="text-[10px] sm:text-sm font-black text-emerald-400 leading-none mt-0 sm:mt-0.5">
                  रू{(profile.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-black/40 shadow-[1px_0_0_rgba(255,255,255,0.03)] mx-1 hidden md:block"></div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {profile && profile.role === 'Admin' && (
              <Link href={isAdminPage ? "/dashboard" : "/admin"} className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] rounded-xl px-3.5 py-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300">
                <Shield size={14} />
                {isAdminPage ? "Dashboard" : "Admin"}
              </Link>
            )}
            
            {profile && (
              <Link href="/settings" className="tour-step-settings hidden md:flex items-center gap-2.5 sm:nm-flat rounded-xl p-1 sm:px-3 sm:py-1.5 sm:border sm:border-white/5 hover:bg-white/5 sm:hover:nm-inset transition-all active:scale-[0.98]">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-main leading-none mb-0.5">{profile.username}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${profile.role === 'Admin' ? 'text-amber-400' : 'text-indigo-400'}`}>{profile.role}</span>
                </div>
                <div className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs ${profile.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner'}`}>
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            )}

            {profile && (
              <button
                onClick={() => window.dispatchEvent(new Event('open_announcements'))}
                className="btn-icon hidden md:flex"
                title="System Alerts & Notices"
              >
                <Megaphone size={16} className="text-amber-500" />
              </button>
            )}

            {profile && <NotificationBell />}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-icon hidden md:flex"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>



            <button 
              onClick={() => { router.push('/logout'); }}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-surface text-rose-400 hover:text-rose-300 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-[-4px_-4px_12px_rgba(255,255,255,0.04),_4px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[-5px_-5px_15px_rgba(255,255,255,0.06),_5px_5px_15px_rgba(0,0,0,0.6)] border border-rose-500/20 active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)]"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface border border-white/5 md:hidden z-50 text-muted transition-all active:scale-95 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),_inset_2px_2px_6px_rgba(0,0,0,0.5)]"
              title="Menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-[calc(100%+1rem)] left-0 right-0 bg-surface/95 backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-3 md:hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-200 z-50 border border-black/5 dark:border-white/5">
          {profile && (
            <div className="flex items-center gap-3 nm-inset rounded-xl p-3 border border-white/5 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${profile.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-main leading-tight">{profile.username}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${profile.role === 'Admin' ? 'text-amber-400' : 'text-indigo-400'}`}>{profile.role}</span>
              </div>
            </div>
          )}

          {profile && profile.role === 'Admin' && (
            <Link 
              href={isAdminPage ? "/dashboard" : "/admin"} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] rounded-xl p-3 text-amber-500 font-bold active:bg-amber-500/20 transition-all"
            >
              <Shield size={18} />
              {isAdminPage ? "Command Center" : "Admin Dashboard"}
            </Link>
          )}

          <Link 
            href="/settings" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 nm-flat rounded-xl p-3 text-main font-bold active:nm-inset transition-all"
          >
            <UserIcon size={18} />
            Profile Settings
          </Link>

          <button
            onClick={() => { window.dispatchEvent(new Event('open_announcements')); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 nm-flat rounded-xl p-3 text-amber-500 font-bold active:nm-inset transition-all w-full text-left"
          >
            <Megaphone size={18} />
            System Alerts & Notices
          </button>

          <button
            onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 nm-flat rounded-xl p-3 text-main font-bold active:nm-inset transition-all w-full text-left"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 nm-flat rounded-xl p-3 text-rose-500 font-bold active:nm-inset transition-all w-full text-left mt-2"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
};

export { Navbar };
export default Navbar;

