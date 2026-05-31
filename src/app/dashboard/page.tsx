'use client';

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  CreditCard,
  LayoutDashboard,
  Rocket,
  Wallet,
  BarChart3,
  Users2,
  Settings,
  RotateCw,
  AlertTriangle,
  Shield,
  Facebook,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/services/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { Navbar } from '@/src/components/layout/Navbar';
import dynamic from 'next/dynamic';

const Analytics = dynamic(() => import("@/src/components/dashboard/Analytics").then(m => m.Analytics), { ssr: false });
const AdminUserManagement = dynamic(() => import("@/src/components/dashboard/AdminUserManagement").then(m => m.AdminUserManagement), { ssr: false });
const BoostRequestTable = dynamic(() => import("@/src/components/dashboard/BoostRequestTable").then(m => m.BoostRequestTable), { ssr: false });
const BalanceRequestTable = dynamic(() => import("@/src/components/dashboard/BalanceRequestTable").then(m => m.BalanceRequestTable), { ssr: false });
const BoostRequestModal = dynamic(() => import("@/src/components/modals/BoostRequestModal").then(m => m.BoostRequestModal), { ssr: false });
const BalanceTopUpModal = dynamic(() => import("@/src/components/modals/BalanceTopUpModal").then(m => m.BalanceTopUpModal), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import("@/src/components/modals/DeleteConfirmationModal").then(m => m.DeleteConfirmationModal), { ssr: false });
const OnboardingTour = dynamic(() => import("@/src/components/dashboard/shared/OnboardingTour").then(m => m.OnboardingTour), { ssr: false });
import { StatCard, StatusBadge } from "@/src/components/dashboard/shared/DashboardComponents";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { BoostRequest, BalanceRequest, RequestStatus } from "@/src/types";
import { generateBoostInvoice, generateTopupInvoice } from "@/src/utils/pdfGenerator";
import DashboardLoading from './loading';

import { DashboardSkeleton } from "@/src/components/common/DashboardSkeleton";

type TabType = "requests" | "analytics" | "users" | "balance";

function DashboardLoader({ isProfileMissing = false }: { isProfileMissing?: boolean }) {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen" suppressHydrationWarning>
      <DashboardSkeleton />
      
      {/* Overlay Hints if loading takes too long */}
      {(showHint || isProfileMissing) && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-surface/80 backdrop-blur-sm">
          {isProfileMissing && showHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 mt-4 max-w-sm text-center px-4"
            >
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                We couldn't fetch your profile data. Please try logging out and logging back in, or contact support if the issue persists.
              </div>
              <button
                onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
                className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors cursor-pointer mt-2"
              >
                Logout & Try Again
              </button>
            </motion.div>
          )}

          {showHint && !isProfileMissing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 mt-2"
            >
              <p className="text-[10px] text-muted text-center max-w-[200px]">Taking longer than usual. Make sure the server is running.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors cursor-pointer mt-2"
              >
                Refresh Engine
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, session, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [itemsPerPage, setItemsPerPage] = useState(50);
  const {
    requests,
    balanceRequests,
    loading: dataLoading,
    currentPage,
    hasMore,
    paginate,
    setRequests,
    setBalanceRequests,
    refresh
  } = useDashboardData(user, profile, session?.access_token || null, itemsPerPage, profile?.role === 'Admin' ? 'all' : 'personal');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadMoneyModalOpen, setIsLoadMoneyModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  
  // View Details Modal State
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);

  // Status Filter State
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [activeTab, setActiveTab] = useState<TabType>("requests");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");

  const [notification, setNotification] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'request' | 'account';
    data: any;
  }>({ isOpen: false, type: 'request', data: null });

  // Admin Settings State
  const [rate, setRate] = useState<number>(135); // default, will be overridden by app settings
  const [platformRates, setPlatformRates] = useState<Record<string, number>>({});
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+977-9843398340");

  // Fetch dynamic exchange rate from backend (avoids RLS)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${apiUrl}/api/settings/app`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to fetch app settings');
        const { data } = await response.json();
        
        if (data) {
          if (data.exchange_rate) setRate(Number(data.exchange_rate));
          
          if (data.whatsapp_number) {
            setWhatsappNumber(data.whatsapp_number);
          } else {
            const savedWhatsApp = localStorage.getItem('whatsapp_number');
            if (savedWhatsApp) setWhatsappNumber(savedWhatsApp);
          }

          if (data.allowed_platforms) {
            setAllowedPlatforms(Array.from(new Set(data.allowed_platforms)));
          } else {
            const saved = localStorage.getItem('allowed_platforms');
            if (saved) {
              try { setAllowedPlatforms(JSON.parse(saved)); } catch (e) {}
            }
          }
          
          if (data.platform_rates) {
            setPlatformRates(data.platform_rates);
          }
        }

        // Fetch Facebook Role Link separately
        const { data: fbData } = await supabase
          .from('app_settings')
          .select('whatsapp_number')
          .eq('id', 'facebook_role_setup')
          .maybeSingle();
        if (fbData && fbData.whatsapp_number) {
          setFacebookRoleLink(fbData.whatsapp_number);
        }

      } catch (error) {
        console.error('Failed to fetch app settings', error);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateRate = async (newRate: number) => {
    setRate(newRate);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/settings/app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exchange_rate: newRate })
      });
      showNotification("Dollar rate updated successfully.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateWhatsApp = (newNumber: string) => {
    setWhatsappNumber(newNumber);
    localStorage.setItem('whatsapp_number', newNumber);
    // Dispatch an event so the WhatsApp button can hear the update
    window.dispatchEvent(new Event('whatsapp_updated'));
    showNotification("WhatsApp support number updated.");
  };

  const [facebookRoleLink, setFacebookRoleLink] = useState<string>("https://www.facebook.com/wilsonstha/");
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>(["Facebook", "Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn"]);
  const [adminAlertMessage, setAdminAlertMessage] = useState<string>("");

  const handleUpdateAllowedPlatforms = (platforms: string[]) => {
    setAllowedPlatforms(platforms);
    localStorage.setItem('allowed_platforms', JSON.stringify(platforms));
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (msg: string) => setNotification(msg);

  const handleUpdateStatus = async (id: string, status: RequestStatus) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    const previousRequests = [...requests];
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    try {
      const { error } = await supabase.from('boost_requests').update({ status }).eq('id', id);
      if (error) throw error;

      // Since balance is now deducted at creation (Pending), we only need to handle Refunds on Rejection
      // and re-deductions if a Rejected request is un-rejected (changed back to Pending or Approved).
      
      const wasRejected = req.status === 'Rejected';
      const isRejected = status === 'Rejected';

      if (!wasRejected && isRejected && req.amountNpr) {
        // Refund because it was rejected
        await supabase.rpc('increment_balance', { user_id: req.userId, amount: req.amountNpr });
        await supabase.from('balance_requests').insert({
          user_id: req.userId,
          username: req.username || 'User',
          amount: req.amountNpr,
          status: 'Approved',
          method: 'Refund (Campaign Rejected)'
        });
      } else if (wasRejected && !isRejected && req.amountNpr) {
        // Re-deduct because it is no longer rejected
        await supabase.rpc('increment_balance', { user_id: req.userId, amount: -req.amountNpr });
      }

      showNotification(`Status updated to ${status}`);
      refresh();
    } catch (error: any) {
      setRequests(previousRequests);
      alert(error.message || "Failed to update status.");
    }
  };

  const handleDeleteRequest = (req: any) => {
    setDeleteConfirm({ isOpen: true, type: "request", data: req });
  };

  const handlePerformDelete = async () => {
    const { type, data } = deleteConfirm;
    try {
      if (type === "request" && data) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/api/delete-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ requestId: data.id })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to delete request');
        }
        
        showNotification("Campaign deleted successfully.");
        refresh();
        await refreshProfile();
      }
    } catch (error: any) {
      alert(error.message || "Deletion failed.");
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleApproveBalance = async (requestId: string) => {
    const request = balanceRequests.find((r) => r.id === requestId);
    if (!request) return;

    try {
      const { error } = await supabase.from('balance_requests').update({ status: "Approved" }).eq('id', requestId);
      if (error) throw error;

      const { error: rpcError } = await supabase.rpc('increment_balance', {
        user_id: request.userId,
        amount: request.amount
      });
      if (rpcError) throw rpcError;

      showNotification("Top-up approved! Balance updated.");
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to approve top-up.");
    }
  };

  const handleRejectBalance = async (requestId: string) => {
    try {
      const { error } = await supabase.from('balance_requests').update({ status: "Rejected" }).eq('id', requestId);
      if (error) throw error;
      showNotification("Balance request rejected.");
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to reject request.");
    }
  };

  const stats = useMemo(() => ({
    total: requests.length,
    approved: requests.filter((r) => r.status === "Approved").length,
    pending: requests.filter((r) => r.status === "Pending").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  }), [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = !searchQuery ||
        (req.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.adGoal || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === "All" || req.platforms?.includes(platformFilter) || req.platform === platformFilter;
      const matchesStatus = filterStatus === "All" || req.status === filterStatus;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [requests, searchQuery, platformFilter, filterStatus]);


// We allow the shell to render even while loading, for better FCP
  const isDataLoading = authLoading || !user || !profile || dataLoading;

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-surface text-main font-sans selection:bg-indigo-500/30 pb-24 lg:pb-8">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] mix-blend-screen" />
          <div className="absolute inset-0 noise-overlay opacity-20 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10">
          <Navbar onSettings={() => {}} />
          {/* Use DashboardLoader to show error if profile is missing after auth loads */}
          <DashboardLoader isProfileMissing={!authLoading && !profile} />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'requests' as TabType, label: 'Campaigns' },
    { id: 'analytics' as TabType, label: 'Analytics' },
    { id: 'balance' as TabType, label: 'Top-ups' },
  ];

  return (
    <div className="min-h-screen bg-surface text-main font-sans selection:bg-indigo-500/30 pb-24 lg:pb-8" suppressHydrationWarning>
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 noise-overlay opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10">
        <Navbar onSettings={() => {}} />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">

        {/* Admin Alert Banner */}
        {adminAlertMessage && (
          <div className="p-4 bg-indigo-600 text-white rounded-2xl flex items-start gap-3 shadow-lg shadow-indigo-600/20">
            <AlertTriangle className="animate-pulse shrink-0 mt-0.5" size={20} />
            <span className="text-sm font-bold leading-snug">{adminAlertMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-main">Command Center</h1>
            <p className="text-muted text-sm font-medium mt-1">
              Active Session: <span className="text-indigo-400 font-bold">{profile?.username || 'Loading...'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setIsLoadMoneyModalOpen(true)}
              className="tour-step-balance btn-success px-5 py-3 rounded-xl flex items-center gap-2"
            >
              <CreditCard size={14} /> Load Balance
            </button>
            <button
              onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}
              className="tour-step-campaign btn-primary px-5 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <Plus size={14} /> New Campaign
            </button>
          </div>
        </div>

        <OnboardingTour />

        {/* Facebook Page Role Setup */}
        <div className="nm-inset bg-surface/50 rounded-3xl p-6 md:p-8 border border-blue-500/10 mb-8 mt-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-5 relative z-10">
            <div className="w-14 h-14 shrink-0 bg-[#1877F2]/10 rounded-2xl flex items-center justify-center border border-[#1877F2]/20 text-[#1877F2] shadow-[inset_0_0_15px_rgba(24,119,242,0.1)]">
              <Facebook size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-main tracking-tight">Facebook Page Role Setup</h2>
              <p className="text-sm font-medium text-muted mt-2 leading-relaxed max-w-4xl">
                Please provide <strong className="text-[#1877F2] font-black tracking-wide">FULL ACCESS</strong> to the following profile for your Facebook Page. This is necessary to allow the admin full control to quickly modify and optimize your campaign settings. It is more logical and good for admin purposes, making the work very fast and easy.
              </p>
              
              <div className="mt-5 flex items-center gap-3">
                <div className="nm-inset px-5 py-3 rounded-xl text-xs sm:text-sm font-mono font-bold text-main border border-white/5 bg-surface-sunken w-full max-w-sm overflow-hidden text-ellipsis whitespace-nowrap shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                  {facebookRoleLink}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(facebookRoleLink);
                    alert("Profile link copied to clipboard!");
                  }}
                  className="w-11 h-11 shrink-0 rounded-xl bg-surface border border-white/5 shadow-[-4px_-4px_12px_var(--nm-shadow-light),_4px_4px_12px_var(--nm-shadow-dark)] flex items-center justify-center text-muted hover:text-main hover:shadow-[-5px_-5px_15px_var(--nm-shadow-light),_5px_5px_15px_var(--nm-shadow-dark)] active:shadow-[inset_-3px_-3px_8px_var(--nm-shadow-light),_inset_3px_3px_8px_var(--nm-shadow-dark)] transition-all duration-200 cursor-pointer"
                  title="Copy Profile Link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Balance" value={`रू ${(profile?.balance || 0).toLocaleString()}`} icon={<Wallet size={22} />} color="emerald" gradient={true} />
          <StatCard title="Total Campaigns" value={stats.total} icon={<LayoutDashboard size={22} />} color="indigo" />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 size={22} />} color="emerald" />
          <StatCard title="Pending" value={stats.pending} icon={<Clock size={22} />} color="amber" />
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex justify-start py-2">
          <div className="tab-pill-wrapper flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-pill whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tabs Design */}
        <div className="md:hidden grid grid-cols-3 gap-1.5 p-1.5 nm-inset rounded-2xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                activeTab === tab.id 
                  ? 'nm-flat text-indigo-400 border border-white/5 shadow-[-2px_-2px_6px_rgba(255,255,255,0.03),_2px_2px_6px_rgba(0,0,0,0.4)]' 
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "requests" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 nm-flat border border-white/5 rounded-2xl p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 nm-inset rounded-xl text-sm font-medium outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all text-main placeholder:text-zinc-600 border border-black/20"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <div className="relative w-full sm:min-w-[160px]">
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="w-full px-4 py-3 nm-inset rounded-xl text-xs uppercase tracking-widest font-black outline-none text-muted focus:border-indigo-500/30 appearance-none cursor-pointer pr-10 border border-black/20"
                    >
                      <option value="All" className="bg-surface">All Networks</option>
                      {allowedPlatforms.map(p => <option key={p} value={p} className="bg-surface">{p}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs">▼</div>
                  </div>

                  <div className="relative w-full sm:min-w-[160px]">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-3 nm-inset rounded-xl text-xs uppercase tracking-widest font-black outline-none text-muted focus:border-indigo-500/30 appearance-none cursor-pointer pr-10 border border-black/20"
                    >
                      <option value="All" className="bg-surface">All Statuses</option>
                      <option value="Pending" className="bg-surface">Pending</option>
                      <option value="Approved" className="bg-surface">Approved</option>
                      <option value="Rejected" className="bg-surface">Rejected</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs">▼</div>
                  </div>
                </div>
              </div>

              <BoostRequestTable
                requests={filteredRequests}
                profile={profile}
                loading={dataLoading}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                hasMore={hasMore}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteRequest}
                onStartEditing={(req) => { setEditingRequest(req); setIsModalOpen(true); }}
                onPaginate={paginate}
                onSetItemsPerPage={setItemsPerPage}
                onGenerateInvoice={generateBoostInvoice}
              />
            </div>
          )}

          {activeTab === "analytics" && <Analytics requests={requests} role={profile.role} />}

          {activeTab === "balance" && (
            <BalanceRequestTable
              requests={balanceRequests}
              profile={profile}
              onApprove={handleApproveBalance}
              onReject={handleRejectBalance}
              onGenerateInvoice={generateTopupInvoice}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <BoostRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRequest(null); }}
        rate={rate}
        platformRates={platformRates}
        whatsappNumber={whatsappNumber}
        profile={profile}
        user={user}
        editingRequestId={editingRequest?.id || null}
        onSuccess={showNotification}
        requests={requests}
        allowedPlatforms={allowedPlatforms}
      />

      <BalanceTopUpModal
        isOpen={isLoadMoneyModalOpen}
        onClose={() => setIsLoadMoneyModalOpen(false)}
        profile={profile}
        user={user}
        onSuccess={showNotification}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handlePerformDelete}
        title="Delete Campaign?"
        message="This campaign will be permanently removed. If it was Pending, your balance will be refunded automatically."
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[200] nm-flat border border-emerald-500/20 text-main px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"
          >
            <CheckCircle2 className="text-emerald-500" size={18} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}


