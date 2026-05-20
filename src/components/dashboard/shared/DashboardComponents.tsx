import React from 'react';
import { LucideIcon } from 'lucide-react';

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: LucideIcon; 
  color: string;
}) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-colors">
    <div className="flex justify-between items-start z-10">
      <div>
        <p className="text-slate-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 transition-colors`}>
        <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
    <Icon 
      size={80} 
      className="absolute -right-4 -bottom-4 opacity-5 text-indigo-500 dark:text-indigo-400 group-hover:opacity-10 transition-opacity" 
    />
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    Pending: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};
