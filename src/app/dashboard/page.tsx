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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/services/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { Navbar } from '@/src/components/layout/Navbar';
import { Analytics } from "@/src/components/dashboard/Analytics";
import { AdminUserManagement } from "@/src/components/dashboard/AdminUserManagement";
import { BoostRequestTable } from "@/src/components/dashboard/BoostRequestTable";
import { BalanceRequestTable } from "@/src/components/dashboard/BalanceRequestTable";
import { AdminSettings } from "@/src/components/dashboard/AdminSettings";
import { BoostRequestModal } from "@/src/components/modals/BoostRequestModal";
import { BalanceTopUpModal } from "@/src/components/modals/BalanceTopUpModal";
import { StatCard, StatusBadge } from "@/src/components/dashboard/shared/DashboardComponents";
import { DeleteConfirmationModal } from "@/src/components/modals/DeleteConfirmationModal";
import { OnboardingTour } from "@/src/components/dashboard/shared/OnboardingTour";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { BoostRequest, BalanceRequest, RequestStatus } from "@/src/types";
import { generateBoostInvoice, generateTopupInvoice } from "@/src/utils/pdfGenerator";

type TabType = "requests" | "analytics" | "users" | "balance";

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
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
  } = useDashboardData(user, profile, itemsPerPage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadMoneyModalOpen, setIsLoadMoneyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BoostRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("requests");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [notification, setNotification] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'request' | 'account';
    data: any;
  }>({ isOpen: false, type: 'request', data: null });

  // Admin Settings State
  const [rate, setRate] = useState<number>(135); // default, will be overridden by app settings
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+977-9843398340");

  // Fetch dynamic exchange rate from backend (avoids RLS)
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/settings/app`);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        const { data } = await res.json();
        if (data && data.exchange_rate) setRate(Number(data.exchange_rate));
      } catch (error) {
        console.error('Failed to fetch exchange rate', error);
      }
    };
    fetchRate();
  }, []);

  const [pageRoleInfo, setPageRoleInfo] = useState<string>("fb.com/admin_profile");
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>(["Facebook", "Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn"]);
  const [adminAlertMessage, setAdminAlertMessage] = useState<string>("");

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

      // Handle balance refund when rejecting
      if (status === 'Rejected' && req.status !== 'Rejected' && req.amountNpr) {
        await supabase.rpc('increment_balance', { user_id: req.userId, amount: req.amountNpr });
      }
      // Undo refund if un-rejecting
      if (req.status === 'Rejected' && status !== 'Rejected' && req.amountNpr) {
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

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 pb-24 lg:pb-8" suppressHydrationWarning>
        <RotateCw className="animate-spin text-indigo-500 w-10 h-10" />
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Initializing Engine...</p>
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
          <div className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-600/20">
            <AlertTriangle className="animate-pulse shrink-0" size={20} />
            <span className="text-sm font-bold">{adminAlertMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-main">Command Center</h1>
            <p className="text-muted text-sm font-medium mt-1">
              Active Session: <span className="text-indigo-400 font-bold">{profile.username}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {profile.role === "Admin" && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="btn-icon w-11 h-11"
                title="System Configuration"
              >
                <Settings size={18} />
              </button>
            )}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Balance" value={`रू ${(profile.balance || 0).toLocaleString()}`} icon={<Wallet size={22} />} color="emerald" gradient={true} />
          <StatCard title="Total Campaigns" value={stats.total} icon={<LayoutDashboard size={22} />} color="indigo" />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 size={22} />} color="emerald" />
          <StatCard title="Pending" value={stats.pending} icon={<Clock size={22} />} color="amber" />
        </div>

        {/* Tabs */}
        <div className="flex justify-start overflow-x-auto table-scrollbar py-2">
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

          {activeTab === "analytics" && <Analytics requests={requests} />}

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
        profile={profile}
        user={user}
        rate={rate}
        editingRequestId={editingRequest?.id || null}
        onSuccess={showNotification}
        requests={requests}
      />

      <BalanceTopUpModal
        isOpen={isLoadMoneyModalOpen}
        onClose={() => setIsLoadMoneyModalOpen(false)}
        profile={profile}
        user={user}
        onSuccess={showNotification}
      />

      <AdminSettings
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        rate={rate}
        whatsappNumber={whatsappNumber}
        pageRoleInfo={pageRoleInfo}
        allowedPlatforms={allowedPlatforms}
        adminAlertMessage={adminAlertMessage}
        invoiceConfig={{
          companyName: "BOOST MANAGER",
          companySubtitle: "Digital Solutions",
          billToLocation: "KATHMANDU, NEPAL"
        }}
        onUpdateRate={setRate}
        onUpdateWhatsApp={setWhatsappNumber}
        onUpdatePageRole={setPageRoleInfo}
        onUpdateAllowedPlatforms={setAllowedPlatforms}
        onUpdateAlert={setAdminAlertMessage}
        onUpdateInvoiceConfig={() => {}}
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
