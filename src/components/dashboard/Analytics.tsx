import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Download, TrendingUp, DollarSign, Target, Globe, Clock, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Request {
  id: string;
  userId: string;
  username: string;
  url: string;
  allocatedBudget: number;
  amountNpr: number;
  date: string;
  createdAt: any;
  status: string;
  adGoal: string;
  platforms: string[];
}

interface AnalyticsProps {
  requests: Request[];
  role?: 'Admin' | 'User';
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Analytics: React.FC<AnalyticsProps> = ({ requests, role = 'User' }) => {
  const [compareMode, setCompareMode] = useState(false);
  const [period1, setPeriod1] = useState({ start: '', end: '' });
  const [period2, setPeriod2] = useState({ start: '', end: '' });
  
  // Data Processing: Daily/Monthly Spending
  const spendingOverTime = useMemo(() => {
    const data: Record<string, number> = {};
    const compareData: Record<string, number> = {};
    
    const sortedRequests = [...requests].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.date);
      const dateB = b.createdAt?.toDate?.() || new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    sortedRequests.forEach(req => {
      if (req.status !== 'Approved') return;
      const date = req.date; 

      if (compareMode && period1.start && period1.end && date >= period1.start && date <= period1.end) {
        data[date] = (data[date] || 0) + req.allocatedBudget;
      } else if (compareMode && period2.start && period2.end && date >= period2.start && date <= period2.end) {
        compareData[date] = (compareData[date] || 0) + req.allocatedBudget;
      } else if (!compareMode) {
        data[date] = (data[date] || 0) + req.allocatedBudget;
      }
    });

    if (compareMode) {
      // Map to indexed days to overlay charts
      const p1Entries = Object.entries(data).sort();
      const p2Entries = Object.entries(compareData).sort();
      const maxLength = Math.max(p1Entries.length, p2Entries.length);
      
      return Array.from({ length: maxLength }).map((_, i) => ({
        name: `Day ${i + 1}`,
        period1: p1Entries[i]?.[1] || 0,
        period2: p2Entries[i]?.[1] || 0,
        date1: p1Entries[i]?.[0],
        date2: p2Entries[i]?.[0]
      }));
    }

    return Object.entries(data).map(([name, amount]) => ({ 
      name, 
      amount,
      period1: amount,
      period2: 0,
      date1: name,
      date2: ''
    }));
  }, [requests, compareMode, period1, period2]);

  const stats = useMemo(() => {
    const filterByPeriod = (reqs: Request[], p: {start: string, end: string}) => {
      if (!p.start || !p.end) return reqs;
      return reqs.filter(r => r.date >= p.start && r.date <= p.end);
    };

    const targetReqs = compareMode ? filterByPeriod(requests, period1) : requests;
    const compareReqs = compareMode ? filterByPeriod(requests, period2) : null;

    const approved = targetReqs.filter(r => r.status === 'Approved').length;
    const total = targetReqs.length;
    const successRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0";

    const currentStats = {
      active: approved,
      rejected: targetReqs.filter(r => r.status === 'Rejected').length,
      pending: targetReqs.filter(r => r.status === 'Pending').length,
      totalSpent: targetReqs.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.allocatedBudget, 0),
      totalRequests: total,
      successRate: successRate
    };

    if (compareReqs) {
      const compApproved = compareReqs.filter(r => r.status === 'Approved').length;
      const compTotalSpent = compareReqs.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.allocatedBudget, 0);
      return {
        ...currentStats,
        compareSpent: compTotalSpent,
        spentDiff: compTotalSpent > 0 ? (((currentStats.totalSpent - compTotalSpent) / compTotalSpent) * 100).toFixed(1) : "0"
      };
    }

    return currentStats;
  }, [requests, compareMode, period1, period2]);

  // Data Processing: Platform Breakdown
  const platformData = useMemo(() => {
    const data: Record<string, number> = {};
    requests.forEach(req => {
      if (req.status !== 'Approved') return;
      req.platforms.forEach(p => {
        data[p] = (data[p] || 0) + (req.allocatedBudget / req.platforms.length);
      });
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // Data Processing: Ad Goal Breakdown
  const goalData = useMemo(() => {
    const data: Record<string, number> = {};
    requests.forEach(req => {
      if (req.status !== 'Approved') return;
      data[req.adGoal] = (data[req.adGoal] || 0) + req.allocatedBudget;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // Admin Specific: Top Users
  const topUsers = useMemo(() => {
    if (role !== 'Admin') return [];
    const data: Record<string, { total: number, name: string }> = {};
    requests.forEach(req => {
      if (req.status !== 'Approved') return;
      if (!data[req.userId]) {
        data[req.userId] = { total: 0, name: req.username || 'Unknown' };
      }
      data[req.userId].total += req.allocatedBudget;
    });
    return Object.entries(data)
      .map(([id, info]) => ({ id, name: info.name, total: info.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [requests, role]);

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'User', 'URL', 'Budget ($)', 'NPR', 'Status', 'Platform', 'Goal'];
    const rows = requests.map(r => [
      r.id,
      r.date,
      r.username || r.userId,
      r.url,
      r.allocatedBudget,
      r.amountNpr,
      r.status,
      r.platforms.join(', '),
      r.adGoal
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Export */}
      <div className="flex flex-col gap-6 border-b border-slate-100 dark:border-zinc-800 pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Analytics Overview</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Deep dive into campaign spending and patterns.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${compareMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'}`}
            >
              <Calendar size={16} /> {compareMode ? 'Disable Comparison' : 'Compare Periods'}
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* Comparison Controls */}
        <AnimatePresence>
          {compareMode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" /> Period A (Primary)
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={period1.start}
                      onChange={(e) => setPeriod1(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 w-full"
                    />
                    <ChevronRight size={16} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={period1.end}
                      onChange={(e) => setPeriod1(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Period B (Comparison)
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={period2.start}
                      onChange={(e) => setPeriod2(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 w-full"
                    />
                    <ChevronRight size={16} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={period2.end}
                      onChange={(e) => setPeriod2(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Stats - Bento Grid style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Spent', value: `$${stats.totalSpent.toLocaleString()}`, color: 'text-slate-900 dark:text-white', icon: DollarSign, trend: (stats as any).spentDiff },
          { label: 'Total Requests', value: stats.totalRequests, color: 'text-indigo-600 dark:text-indigo-400', icon: Target },
          { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
          { label: 'Active Ads', value: stats.active, color: 'text-indigo-600 dark:text-indigo-400', icon: Globe },
          { label: 'Pending Ad', value: stats.pending, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}                
            className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={16} className="text-slate-400" />
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
            <div className="flex items-end justify-between">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              {stat.trend && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(stat.trend) >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {Number(stat.trend) >= 0 ? '+' : ''}{stat.trend}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time Line Chart */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Spending Trend</h4>
            {compareMode && (
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1 text-indigo-600">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" /> Period A
                </div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Period B
                </div>
              </div>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#18181b',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, name: string) => [
                    `$${Number(value).toLocaleString()}`, 
                    name === 'period1' ? 'Period A' : name === 'period2' ? 'Period B' : 'Spending'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey={compareMode ? "period1" : "amount"} 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
                {compareMode && (
                  <Line 
                    type="monotone" 
                    dataKey="period2" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown Bar Chart */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 text-lg">Platform Distribution</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#18181b',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Goal Breakdown - simplified and cleaner */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm lg:col-span-2">
          <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 text-lg">Ad Goals Allocation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {goalData.map((goal, index) => (
              <div key={goal.name} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-indigo-600 font-black text-xl mb-1">${goal.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{goal.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Section: Top Users */}
        {role === 'Admin' && (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm lg:col-span-2">
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 text-lg">Top Spending Users</h4>
            <div className="space-y-4">
              {topUsers.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-slate-500">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{user.name}</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">${user.total.toLocaleString()}</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(user.total / (topUsers[0].total || 1)) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {topUsers.length === 0 && (
                <p className="text-center text-slate-400 italic py-8">No spending data available yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
