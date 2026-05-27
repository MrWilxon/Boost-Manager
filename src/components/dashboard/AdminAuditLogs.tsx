'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Activity, Search, Clock, User, FileText } from 'lucide-react';

const formatDistanceToNow = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiUrl}/api/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const { data } = await res.json();
      setLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const s = searchQuery.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(s);
    const userMatch = log.performer?.username?.toLowerCase().includes(s) || log.performer?.email?.toLowerCase().includes(s);
    const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(s);
    return actionMatch || userMatch || detailsMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-main flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Audit Logs
          </h2>
          <p className="text-sm text-muted">System activity and security events (last 100).</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full nm-inset bg-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="nm-flat rounded-3xl overflow-hidden border border-white/5">
        <div className="hidden md:block overflow-x-auto table-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Clock size={14} />
                        {formatDistanceToNow(new Date(log.created_at))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-main">
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          <User size={12} />
                        </div>
                        <div className="text-sm">
                          <div className="font-bold text-main">{log.performer?.username || 'System'}</div>
                          <div className="text-xs text-muted">{log.performer?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {Object.keys(log.details || {}).length > 0 ? (
                        <div className="text-xs font-mono text-muted bg-white/5 p-2 rounded-lg inline-block border border-white/5 break-all">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-muted text-xs italic">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col p-4 gap-4">
          {loading ? (
            <div className="py-8 text-center text-muted">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                Loading logs...
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted font-bold">
              No activity logs found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="nm-flat bg-surface rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-main">
                    {log.action}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(log.created_at))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <User size={12} />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-main leading-tight">{log.performer?.username || 'System'}</div>
                    <div className="text-[10px] text-muted">{log.performer?.email}</div>
                  </div>
                </div>

                {Object.keys(log.details || {}).length > 0 && (
                  <div className="mt-2 text-[10px] font-mono text-muted bg-white/5 p-2 rounded-lg border border-white/5 break-all max-h-32 overflow-y-auto">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
