'use client';

import React, { useState } from 'react';
import { supabase } from '@/src/services/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Users, Rocket, CreditCard, Tag, Activity, Settings } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { Navbar } from '@/src/components/layout/Navbar';
import dynamic from 'next/dynamic';

const AdminUserManagement = dynamic(() => import('@/src/components/dashboard/AdminUserManagement').then(m => m.AdminUserManagement), { ssr: false });
const BoostRequestTable = dynamic(() => import('@/src/components/dashboard/BoostRequestTable').then(m => m.BoostRequestTable), { ssr: false });
const BalanceRequestTable = dynamic(() => import('@/src/components/dashboard/BalanceRequestTable').then(m => m.BalanceRequestTable), { ssr: false });
const AdminPromoCodes = dynamic(() => import('@/src/components/dashboard/AdminPromoCodes').then(m => m.AdminPromoCodes), { ssr: false });
const AdminAnnouncements = dynamic(() => import('@/src/components/dashboard/AdminAnnouncements').then(m => m.AdminAnnouncements), { ssr: false });
const AdminAuditLogs = dynamic(() => import('@/src/components/dashboard/AdminAuditLogs').then(m => m.AdminAuditLogs), { ssr: false });
const AdminSystemConfig = dynamic(() => import('@/src/components/dashboard/AdminSystemConfig').then(m => m.AdminSystemConfig), { ssr: false });
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { generateBoostInvoice, generateTopupInvoice } from '@/src/utils/pdfGenerator';
import AdminLoading from './loading';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'boosts' | 'topups' | 'promos' | 'announcements' | 'audit' | 'config'>('users');
  
  const {
    requests,
    balanceRequests,
    loading: dataLoading,
    setRequests,
    setBalanceRequests
  } = useDashboardData(user, profile, 100, 'all');

  // Redirect if not admin
  React.useEffect(() => {
    if (!authLoading && profile && profile.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [authLoading, profile, router]);

  const isDataLoading = authLoading || (profile && profile.role !== 'Admin') || dataLoading;

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-surface text-muted font-sans selection:bg-indigo-500/30">
        <Navbar onSettings={() => {}} />
        <AdminLoading />
      </div>
    );
  }

  // Handle admin actions on tables
  const handleUpdateStatus = async (id: string, status: any) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      const { error } = await supabase.from('boost_requests').update({ status }).eq('id', id);
      if (error) throw error;
      if (req.amountNpr) {
        if (status === 'Approved' && req.status !== 'Approved') await supabase.rpc('increment_balance', { user_id: req.userId, amount: -req.amountNpr });
        if (req.status === 'Approved' && status !== 'Approved') await supabase.rpc('increment_balance', { user_id: req.userId, amount: req.amountNpr });
        if (status === 'Rejected' && req.status !== 'Rejected') await supabase.rpc('increment_balance', { user_id: req.userId, amount: req.amountNpr });
        if (req.status === 'Rejected' && status !== 'Rejected') await supabase.rpc('increment_balance', { user_id: req.userId, amount: -req.amountNpr });
      }
    } catch (e: any) {
      console.error(e);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: req.status } : r));
      alert(e.message || "Failed to update status.");
    }
  };
  const handleDeleteRequest = (req: any) => {
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };
  const handleUpdateBalanceStatus = (id: string, status: any) => {
    setBalanceRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };
  const handleDeleteBalanceRequest = (id: string) => {
    setBalanceRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface text-muted font-sans selection:bg-indigo-500/30" suppressHydrationWarning>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        {/* Header */}
        <div className="nm-flat rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl nm-inset flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
              <Shield size={28} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-main tracking-tight flex items-center gap-3">
                Admin Console
                <span className="px-2.5 py-1 nm-inset rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20">Superuser</span>
              </h1>
              <p className="text-muted text-sm font-bold mt-1">Manage users, boost campaigns, and financial requests.</p>
            </div>
          </div>
        </div>

        {/* Neumorphic Tabs */}
        <div className="flex flex-wrap items-center gap-4 mb-8 nm-inset p-2 rounded-2xl border border-white/5 inline-flex">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'users' ? 'nm-flat text-indigo-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Users size={16} /> Users
          </button>
          <button
            onClick={() => setActiveTab('boosts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'boosts' ? 'nm-flat text-amber-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Rocket size={16} /> Boost Requests
          </button>
          <button
            onClick={() => setActiveTab('topups')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'topups' ? 'nm-flat text-emerald-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <CreditCard size={16} /> Top-ups
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'promos' ? 'nm-flat text-pink-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Tag size={16} /> Promos
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'announcements' ? 'nm-flat text-orange-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Activity size={16} /> Notice
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'audit' ? 'nm-flat text-cyan-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Activity size={16} /> Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'config' ? 'nm-flat text-rose-400 border border-white/5 shadow-[-3px_-3px_8px_rgba(255,255,255,0.03),_3px_3px_8px_rgba(0,0,0,0.4)]' : 'text-muted hover:text-muted hover:nm-flat hover:border-transparent'
            }`}
          >
            <Settings size={16} /> System Config
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'users' && (
            <div className="nm-flat rounded-3xl p-6 border border-white/5">
              <AdminUserManagement />
            </div>
          )}

          {activeTab === 'boosts' && (
            <BoostRequestTable 
              requests={requests}
              loading={dataLoading}
              profile={profile}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteRequest}
              onGenerateInvoice={generateBoostInvoice}
            />
          )}

          {activeTab === 'topups' && (
            <BalanceRequestTable 
              requests={balanceRequests}
              profile={profile}
              onApprove={(id) => handleUpdateBalanceStatus(id, 'Approved')}
              onReject={(id) => handleUpdateBalanceStatus(id, 'Rejected')}
              onDelete={handleDeleteBalanceRequest}
              onGenerateInvoice={generateTopupInvoice}
            />
          )}

          {activeTab === 'promos' && (
            <div className="nm-flat rounded-3xl p-6 border border-white/5">
              <AdminPromoCodes />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="nm-flat rounded-3xl p-6 border border-white/5">
              <AdminAnnouncements />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="nm-flat rounded-3xl p-6 border border-white/5">
              <AdminAuditLogs />
            </div>
          )}

          {activeTab === 'config' && (
            <div className="nm-flat rounded-3xl p-6 border border-white/5">
              <AdminSystemConfig />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}




