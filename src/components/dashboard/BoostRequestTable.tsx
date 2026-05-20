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
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from './shared/DashboardComponents';
import { TableRowSkeleton } from '../common/Skeleton';
import { RequestStatus, BoostRequest, UserProfile } from '../../types';

interface BoostRequestTableProps {
  requests: BoostRequest[];
  loading: boolean;
  profile: UserProfile | null;
  currentPage: number;
  itemsPerPage: number;
  hasMore: boolean;
  loadingMore: boolean;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onUpdateRemarks: (id: string, remarks: string) => void;
  onDeleteRequest: (req: BoostRequest) => void;
  onGenerateInvoice: (req: BoostRequest) => void;
  onPreviewRequest: (id: string) => void;
  onStartEditing: (req: BoostRequest) => void;
  onPaginate: (direction: 'next' | 'prev') => void;
  onSetItemsPerPage: (count: number) => void;
  onSetEditingRemarks: (id: string, value: string) => void;
}

export const BoostRequestTable: React.FC<BoostRequestTableProps> = ({
  requests,
  loading,
  profile,
  currentPage,
  itemsPerPage,
  hasMore,
  loadingMore,
  onUpdateStatus,
  onDeleteRequest,
  onGenerateInvoice,
  onPreviewRequest,
  onStartEditing,
  onPaginate,
  onSetItemsPerPage,
  onSetEditingRemarks,
}) => {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-12">#</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Campaign Info</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Total Cost</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Platform / Goal</th>
              {profile?.role === "Admin" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">User</th>}
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Remarks</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
            {loading ? (
              Array(itemsPerPage).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={profile?.role === "Admin" ? 8 : 7} className="px-6 py-16 text-center text-slate-400 dark:text-zinc-500 italic">
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <Search className="mb-2" size={32} />
                    <p className="text-base font-bold">No matching requests found</p>
                    <p className="text-xs">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr key={req.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all duration-200">
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-xs ring-1 ring-slate-200/50 dark:ring-zinc-700/50 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 max-w-[200px]">
                      <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{req.date}</span>
                      <a href={req.url} target="_blank" rel="noopener noreferrer" className="text-slate-900 dark:text-zinc-100 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-sm group/link underline decoration-transparent hover:decoration-indigo-500/30 underline-offset-4">
                        <span className="truncate w-full inline-block">Boost Link</span>
                        <ExternalLink size={12} className="shrink-0 opacity-40 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-black text-slate-900 dark:text-zinc-100 tracking-tight">${req.budget}</span>
                      {/* Note: In real app budget might be different field names, but using shared types here */}
                      {(req as any).amountNpr && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md self-start">
                          रू{(req as any).amountNpr.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {profile?.role === "Admin" ? (
                      <div className="relative inline-block group/select">
                        <select
                          className={`appearance-none pl-3 pr-8 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none ${
                            req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            req.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                          value={req.status}
                          onChange={(e) => onUpdateStatus(req.id, e.target.value as RequestStatus)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-60 pointer-events-none" />
                      </div>
                    ) : (
                      <StatusBadge status={req.status} />
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {(req as any).platforms?.map((p: string) => (
                          <span key={p} className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded ring-1 ring-slate-200/50 dark:ring-zinc-700/50">
                            {p}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                        {req.adGoal} / <span className="text-indigo-600 dark:text-indigo-400">{(req as any).destination}</span>
                      </span>
                    </div>
                  </td>
                  {profile?.role === "Admin" && (
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate max-w-[120px]">{req.username}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.userId.slice(0, 8)}...</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-5">
                    {profile?.role === "Admin" ? (
                      <button
                        onClick={() => onSetEditingRemarks(req.id, req.remarks || "")}
                        className="group/rem hover:bg-emerald-50 dark:hover:bg-emerald-500/10 p-2 rounded-xl border border-slate-100 dark:border-zinc-800 transition-all flex items-center gap-2 max-w-[180px]"
                      >
                        <Tag size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 truncate text-left">
                          {req.remarks || "Add remark"}
                        </span>
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 max-w-[180px]">
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 italic">
                          {req.remarks || "No remarks shared"}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {profile?.role === "Admin" && (
                        <>
                          <button onClick={() => onPreviewRequest(req.id)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl" title="Preview">
                            <Eye size={18} />
                          </button>
                          {req.status === "Approved" && (
                            <button onClick={() => onGenerateInvoice(req)} className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl" title="Invoice">
                              <Download size={18} />
                            </button>
                          )}
                        </>
                      )}
                      <button onClick={() => onStartEditing(req)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => onDeleteRequest(req)} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden p-4 space-y-4">
        {requests.map((req, idx) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400">{req.date}</span>
              <StatusBadge status={req.status} />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-black">{req.adGoal} / {(req as any).destination}</h4>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Budget</p>
                  <p className="text-base font-black">${req.budget}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onStartEditing(req)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => onDeleteRequest(req)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onSetItemsPerPage(Number(e.target.value))}
            className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={currentPage === 1 || loadingMore} onClick={() => onPaginate("prev")} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold">Page {currentPage}</span>
          <button disabled={!hasMore || loadingMore} onClick={() => onPaginate("next")} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
