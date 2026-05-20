import React from 'react';
import { Search, X } from 'lucide-react';
import { BalanceRequest, UserProfile } from '../../types';

interface BalanceRequestTableProps {
  requests: BalanceRequest[];
  profile: UserProfile | null;
  showHistory: boolean;
  onToggleHistory: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  amountFilter: string;
  onAmountFilterChange: (val: string) => void;
  dateStart: string;
  onDateStartChange: (val: string) => void;
  dateEnd: string;
  onDateEndChange: (val: string) => void;
}

export const BalanceRequestTable: React.FC<BalanceRequestTableProps> = ({
  requests,
  profile,
  showHistory,
  onToggleHistory,
  onApprove,
  onReject,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  amountFilter,
  onAmountFilterChange,
  dateStart,
  onDateStartChange,
  dateEnd,
  onDateEndChange,
}) => {
  if (profile?.role !== 'Admin') return null;

  return (
    <section className="mt-8 bg-white dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center sm:flex-row flex-col gap-4">
        <h3 className="font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-tight">
          {showHistory ? "Balance Top-up History" : "Pending Top-up Requests"}
        </h3>
        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            showHistory 
              ? "bg-indigo-600 text-white" 
              : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          }`}
        >
          {showHistory ? "View Pending Only" : "View Full History"}
        </button>
      </div>

      {showHistory && (
        <div className="px-6 py-4 bg-slate-50/30 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search user..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={12} />
              </button>
            )}
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input 
            type="number"
            placeholder="Min Amount..."
            value={amountFilter}
            onChange={(e) => onAmountFilterChange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
          />
          <div className="flex gap-2">
            <input type="date" value={dateStart} onChange={(e) => onDateStartChange(e.target.value)} className="flex-1 px-2 py-1 bg-white dark:bg-zinc-950 border rounded text-[10px]" />
            <input type="date" value={dateEnd} onChange={(e) => onDateEndChange(e.target.value)} className="flex-1 px-2 py-1 bg-white dark:bg-zinc-950 border rounded text-[10px]" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-bold">{req.username}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{req.date}</td>
                <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">
                  रू{req.amount?.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === "Pending" ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onApprove(req.id)} className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 uppercase">Approve</button>
                      <button onClick={() => onReject(req.id)} className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 uppercase">Reject</button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
