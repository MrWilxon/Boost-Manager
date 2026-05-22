import React, { useState } from 'react';
import { Search, X, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { BalanceRequest, UserProfile } from '../../types';

interface BalanceRequestTableProps {
  requests: BalanceRequest[];
  profile: UserProfile | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const BalanceRequestTable: React.FC<BalanceRequestTableProps> = ({
  requests,
  profile,
  onApprove,
  onReject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  if (profile?.role !== 'Admin') return null;

  const filtered = requests.filter((r) => {
    const matchSearch = !searchQuery || (r.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <section className="mt-8 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Wallet size={18} />
          </div>
          <h3 className="font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight text-sm">
            Balance Top-up Requests
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 w-40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={12} />
              </button>
            )}
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filtered.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100">{req.username}</td>
                <td className="px-6 py-4 text-xs text-slate-500 dark:text-zinc-400">{req.date}</td>
                <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-black">
                  रू{req.amount?.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    req.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                    req.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                    'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === "Pending" ? (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onApprove(req.id)} 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg uppercase flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button 
                        onClick={() => onReject(req.id)} 
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg uppercase flex items-center gap-1.5 transition-all"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">No balance requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
