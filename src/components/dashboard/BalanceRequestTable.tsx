import React, { useState } from 'react';
import { Search, X, CheckCircle2, XCircle, Wallet, Download, Trash2 } from 'lucide-react';
import { BalanceRequest, UserProfile } from '../../types';

interface BalanceRequestTableProps {
  requests: BalanceRequest[];
  profile: UserProfile | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerateInvoice?: (req: BalanceRequest) => void;
}

export const BalanceRequestTable: React.FC<BalanceRequestTableProps> = ({
  requests,
  profile,
  onApprove,
  onReject,
  onDelete,
  onGenerateInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = requests.filter((r) => {
    const matchSearch = !searchQuery || (r.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <section className="mt-8 nm-flat rounded-3xl border border-white/5 overflow-hidden">
      <div className="px-6 py-5 border-b border-black/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161719]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 nm-inset rounded-xl text-emerald-400 shadow-[inset_0_0_8px_rgba(16,185,129,0.1)] border border-emerald-500/20">
            <Wallet size={18} />
          </div>
          <h3 className="font-black text-main uppercase tracking-widest text-sm">
            Top-up History
          </h3>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-3 nm-inset bg-surface border border-transparent focus:border-indigo-500/30 rounded-xl text-xs font-bold text-main placeholder-zinc-600 outline-none transition-all shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted">
                <X size={14} />
              </button>
            )}
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 nm-inset bg-surface border border-transparent focus:border-indigo-500/30 rounded-xl text-xs font-black text-muted outline-none cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto table-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#161719] border-b border-black/30 text-[10px] font-black uppercase tracking-widest text-muted">
            <tr>
              <th className="px-6 py-5">User</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Amount</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {filtered.map((req) => (
              <tr key={req.id} className="hover:bg-[#1C1E21] transition-colors group">
                <td className="px-6 py-5 font-bold text-main">
                  <div className="flex flex-col">
                    <span>{req.username}</span>
                    {profile?.role === 'Admin' && <span className="text-[9px] text-muted font-mono mt-0.5">{req.userId?.slice(0, 8)}</span>}
                  </div>
                </td>
                <td className="px-6 py-5 text-xs font-bold text-muted">{new Date(req.timestamp || Date.now()).toLocaleDateString()}</td>
                <td className="px-6 py-5">
                  <span className="text-emerald-400 font-black tracking-wide drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]">
                    रू{req.amount?.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest nm-inset ${
                    req.status === 'Pending' ? 'text-amber-500 border border-amber-500/20' :
                    req.status === 'Approved' ? 'text-emerald-500 border border-emerald-500/20' :
                    'text-rose-500 border border-rose-500/20'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    {req.status === 'Approved' && onGenerateInvoice && (
                      <button 
                        onClick={() => onGenerateInvoice(req)} 
                        className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-emerald-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5" 
                        title="Download Receipt"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    {profile?.role === 'Admin' && req.status === "Pending" && (
                      <>
                        {onApprove && (
                          <button 
                            onClick={() => onApprove(req.id)} 
                            className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-emerald-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5"
                            title="Approve"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {onReject && (
                          <button 
                            onClick={() => onReject(req.id)} 
                            className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </>
                    )}
                    {profile?.role === 'Admin' && onDelete && (
                      <button 
                        onClick={() => onDelete(req.id)} 
                        className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted italic text-sm font-bold">No balance requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col p-4 gap-4">
        {filtered.map((req) => (
          <div key={req.id} className="nm-flat bg-surface rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-bold text-main text-sm">{req.username}</span>
                {profile?.role === 'Admin' && <span className="text-[10px] text-muted font-mono">{req.userId?.slice(0, 8)}</span>}
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest nm-inset ${
                req.status === 'Pending' ? 'text-amber-500 border border-amber-500/20' :
                req.status === 'Approved' ? 'text-emerald-500 border border-emerald-500/20' :
                'text-rose-500 border border-rose-500/20'
              }`}>
                {req.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted font-bold">{new Date(req.timestamp || Date.now()).toLocaleDateString()}</span>
              <span className="text-emerald-400 font-black tracking-wide drop-shadow-[0_0_5px_rgba(16,185,129,0.2)] text-sm">
                रू{req.amount?.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              {req.status === 'Approved' && onGenerateInvoice && (
                <button 
                  onClick={() => onGenerateInvoice(req)} 
                  className="w-10 h-10 rounded-xl nm-flat text-emerald-400 flex items-center justify-center border border-white/5 active:scale-95" 
                >
                  <Download size={16} />
                </button>
              )}
              {profile?.role === 'Admin' && req.status === "Pending" && (
                <>
                  {onApprove && (
                    <button 
                      onClick={() => onApprove(req.id)} 
                      className="w-10 h-10 rounded-xl nm-flat text-emerald-400 flex items-center justify-center border border-white/5 active:scale-95"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  {onReject && (
                    <button 
                      onClick={() => onReject(req.id)} 
                      className="w-10 h-10 rounded-xl nm-flat text-rose-400 flex items-center justify-center border border-white/5 active:scale-95"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </>
              )}
              {profile?.role === 'Admin' && onDelete && (
                <button 
                  onClick={() => onDelete(req.id)} 
                  className="w-10 h-10 rounded-xl nm-flat text-rose-400 flex items-center justify-center border border-white/5 active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted italic text-sm font-bold py-8">No balance requests found.</div>
        )}
      </div>
    </section>
  );
};
