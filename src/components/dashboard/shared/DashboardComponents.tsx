import React from 'react';
import type { ReactNode } from 'react';

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  color,
  gradient
}: { 
  title: string; 
  value: string | number; 
  icon: ReactNode; 
  color: string;
  gradient?: boolean;
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]',
    emerald: 'text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    amber: 'text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    rose: 'text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  };

  const borderMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  const cls = colorMap[color] || colorMap.indigo;
  const borderColorCls = borderMap[color] || borderMap.indigo;

  if (gradient) {
    return (
      <div className="nm-flat rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:nm-concave transition-all duration-300">
        {/* Top brand line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
        
        <div className="flex justify-between items-start z-10 w-full">
          <div>
            <p className="text-emerald-400/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-3xl font-black text-main leading-none tracking-tight">{value}</h3>
          </div>
          <div className="p-3 rounded-xl nm-inset text-emerald-400 border border-emerald-500/25 shadow-inner">
            {icon}
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity text-emerald-500" style={{ transform: 'scale(3.5)', transformOrigin: 'bottom right' }}>
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div className="nm-flat rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:nm-concave transition-all duration-300">
      {/* Top brand line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${borderColorCls}`}></div>
      {/* Ambient background glow */}
      <div className={`absolute -right-10 -bottom-10 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${color === 'indigo' ? 'bg-indigo-500/5' : color === 'amber' ? 'bg-amber-500/5' : 'bg-rose-500/5'}`}></div>
      
      <div className="flex justify-between items-start z-10 w-full">
        <div>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-2xl font-black text-main leading-none tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl nm-inset ${cls}`}>
          {icon}
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${color === 'indigo' ? 'text-indigo-400' : color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`} style={{ transform: 'scale(3)', transformOrigin: 'bottom right' }}>
        {icon}
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Approved: 'nm-inset text-emerald-400 border-emerald-500/10',
    Pending: 'nm-inset text-amber-400 border-amber-500/10',
    Rejected: 'nm-inset text-rose-400 border-rose-500/10',
  };

  return (
    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5 w-fit ${styles[status] || styles.Pending}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'Approved' ? 'bg-emerald-400 animate-pulse' : status === 'Pending' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'}`}></div>
      {status}
    </span>
  );
};
