import React from 'react';
import { 
  ExternalLink, 
  ChevronDown, 
  Tag, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from './shared/DashboardComponents';
import { TableRowSkeleton } from '../common/Skeleton';
import { RequestStatus, BoostRequest, UserProfile } from '../../types';

interface BoostRequestTableProps {
  requests: BoostRequest[];
  loading: boolean;
  profile: UserProfile | null;
  currentPage?: number;
  itemsPerPage?: number;
  hasMore?: boolean;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onDelete: (req: BoostRequest) => void;
  onGenerateInvoice?: (req: BoostRequest) => void;
  onStartEditing?: (req: BoostRequest) => void;
  onPaginate?: (direction: 'next' | 'prev') => void;
  onSetItemsPerPage?: (count: number) => void;
}

export const BoostRequestTable: React.FC<BoostRequestTableProps> = ({
  requests,
  loading,
  profile,
  currentPage = 1,
  itemsPerPage = 50,
  hasMore = false,
  onUpdateStatus,
  onDelete,
  onGenerateInvoice,
  onStartEditing,
  onPaginate,
  onSetItemsPerPage,
}) => {
  const stripeClassMap: Record<RequestStatus, string> = {
    Approved: 'status-stripe-approved',
    Pending: 'status-stripe-pending',
    Rejected: 'status-stripe-rejected'
  };

  return (
    <section className="nm-flat rounded-2xl border border-white/5 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto table-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#161719] text-muted border-b border-black/30">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-12">#</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Campaign Info</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Cost</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Platform / Goal</th>
              {profile?.role === "Admin" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">User</th>}
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Remarks</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {loading ? (
              Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={profile?.role === "Admin" ? 8 : 7} className="px-6 py-16 text-center text-muted italic">
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <Search className="mb-2" size={32} />
                    <p className="text-base font-bold">No campaigns found</p>
                    <p className="text-xs">Create your first boost campaign using the Deploy Campaign button.</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => {
                const stripeCls = stripeClassMap[req.status] || 'status-stripe-pending';
                return (
                  <tr key={req.id} className={`group hover:bg-white/5 transition-all duration-200 border-l-[3px] border-transparent ${stripeCls}`}>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg nm-inset text-muted font-black text-xs border border-black/25">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">{req.date}</span>
                        <a href={req.url} target="_blank" rel="noopener noreferrer" className="text-muted font-bold hover:text-main transition-colors flex items-center gap-1.5 text-sm">
                          <span className="truncate max-w-[150px] inline-block">{req.url.replace(/^https?:\/\//, '').slice(0, 30)}...</span>
                          <ExternalLink size={12} className="shrink-0 opacity-40" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-black text-main tracking-tight">${req.budget || req.allocatedBudget || 0}</span>
                        {req.amountNpr && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md self-start">
                            रू{req.amountNpr.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {profile?.role === "Admin" ? (
                        <div className="relative inline-block">
                          <select
                            className={`appearance-none pl-3.5 pr-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none nm-inset border-black/25 ${
                              req.status === "Approved" ? "text-emerald-400" :
                              req.status === "Rejected" ? "text-rose-400" :
                              "text-amber-400"
                            }`}
                            value={req.status}
                            onChange={(e) => onUpdateStatus(req.id, e.target.value as RequestStatus)}
                          >
                            <option value="Pending" className="bg-surface">Pending</option>
                            <option value="Approved" className="bg-surface">Approved</option>
                            <option value="Rejected" className="bg-surface">Rejected</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-60 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <StatusBadge status={req.status} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {req.platforms?.map((p: string) => (
                            <span key={p} className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 nm-inset text-muted border border-black/20 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-muted leading-tight">
                          {req.adGoal} {req.destination && <span className="text-indigo-400">/ {req.destination}</span>}
                        </span>
                      </div>
                    </td>
                    {profile?.role === "Admin" && (
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-zinc-200 truncate max-w-[120px]">{req.username}</span>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">{req.userId?.slice(0, 8)}...</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="p-2.5 nm-inset rounded-xl max-w-[180px] overflow-hidden border border-black/25">
                        <p className="text-xs font-medium text-muted truncate" title={req.remarks || "No remarks"}>
                          {req.remarks || "No remarks"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {req.status === "Approved" && onGenerateInvoice && (
                          <button onClick={() => onGenerateInvoice(req)} className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-emerald-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5" title="Invoice">
                            <Download size={14} />
                          </button>
                        )}
                        {onStartEditing && (
                          <button onClick={() => onStartEditing(req)} className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-indigo-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5" title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        <button onClick={() => onDelete(req)} className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 nm-flat rounded-2xl animate-pulse border border-white/5" />
          ))
        ) : requests.length === 0 ? (
          <p className="text-center py-12 text-muted italic text-sm">No campaigns found.</p>
        ) : (
          requests.map((req) => {
            const stripeCls = stripeClassMap[req.status] || 'status-stripe-pending';
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`nm-flat p-5 rounded-2xl border border-white/5 relative overflow-hidden ${stripeCls}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">{req.date}</span>
                  <StatusBadge status={req.status} />
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {req.platforms?.map((p: string) => (
                    <span key={p} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 nm-inset text-muted border border-black/20 rounded-md">
                      {p}
                    </span>
                  ))}
                  {req.adGoal && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 nm-inset text-indigo-400 border border-indigo-500/10 rounded-md">
                      {req.adGoal}
                    </span>
                  )}
                </div>

                <a href={req.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-400 hover:underline truncate block mb-4 flex items-center gap-1">
                  <span>{req.url.replace(/^https?:\/\//, '').slice(0, 32)}...</span>
                  <ExternalLink size={10} className="shrink-0" />
                </a>

                <div className="flex justify-between items-end pt-3 border-t border-black/20">
                  <div>
                    <span className="text-[8px] font-black text-muted uppercase tracking-widest leading-none block mb-1">Cost</span>
                    <span className="text-base font-black text-main">${req.budget || req.allocatedBudget || 0}</span>
                    {req.amountNpr && (
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md ml-2 inline-block">
                        रू{req.amountNpr.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {onStartEditing && (
                      <button onClick={() => onStartEditing(req)} className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-indigo-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5">
                        <Edit size={14} />
                      </button>
                    )}
                    <button onClick={() => onDelete(req)} className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95] active:nm-inset border border-white/5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {onPaginate && (
        <div className="px-6 py-4 border-t border-black/30 flex justify-between items-center bg-[#161719]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-muted uppercase tracking-widest">Show</span>
            {onSetItemsPerPage && (
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => onSetItemsPerPage(Number(e.target.value))}
                  className="nm-inset text-muted font-black rounded-xl pl-3 pr-8 py-2 text-xs outline-none focus:border-indigo-500/30 cursor-pointer appearance-none border border-black/25"
                >
                  <option value={10} className="bg-surface">10</option>
                  <option value={50} className="bg-surface">50</option>
                  <option value={100} className="bg-surface">100</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-[8px]">▼</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              disabled={currentPage === 1} 
              onClick={() => onPaginate("prev")} 
              className="w-9 h-9 rounded-xl nm-flat hover:nm-concave text-muted hover:text-main flex items-center justify-center disabled:opacity-30 transition-all duration-200 cursor-pointer active:scale-[0.95] disabled:pointer-events-none border border-white/5 active:nm-inset"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-main px-2.5">Page {currentPage}</span>
            <button 
              disabled={!hasMore} 
              onClick={() => onPaginate("next")} 
              className="w-9 h-9 rounded-xl nm-flat hover:nm-concave text-muted hover:text-main flex items-center justify-center disabled:opacity-30 transition-all duration-200 cursor-pointer active:scale-[0.95] disabled:pointer-events-none border border-white/5 active:nm-inset"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
