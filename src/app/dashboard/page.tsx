'use client';

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  LayoutDashboard,
  AlertCircle,
  Rocket,
  Users2,
  Wallet,
  Archive,
  BarChart2,
  PieChart as PieChartIcon,
  Settings,
  Tag,
  Trash2,
  Eye,
  RotateCw,
  Facebook,
  Copy,
  History,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/services/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { Navbar } from '@/src/components/layout/Navbar';
import { Analytics } from "@/src/components/dashboard/Analytics";
import { AdminUserManagement } from "@/src/components/dashboard/AdminUserManagement";
import { AdminLocationManagement } from "@/src/components/dashboard/AdminLocationManagement";
import { BoostRequestTable } from "@/src/components/dashboard/BoostRequestTable";
import { BalanceRequestTable } from "@/src/components/dashboard/BalanceRequestTable";
import { AdminSettings } from "@/src/components/dashboard/AdminSettings";
import { BoostRequestModal } from "@/src/components/modals/BoostRequestModal";
import { BalanceTopUpModal } from "@/src/components/modals/BalanceTopUpModal";
import { InvoiceGenerator } from "@/src/components/dashboard/InvoiceGenerator";
import { 
  StatCard, 
  StatusBadge 
} from "@/src/components/dashboard/shared/DashboardComponents";
import { CardSkeleton, TableRowSkeleton } from "@/src/components/common/Skeleton";
import { DeleteConfirmationModal } from "@/src/components/modals/DeleteConfirmationModal";
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { APP_CONFIG, ALL_PLATFORMS } from "@/src/constants";
import { BoostRequest, BalanceRequest, RequestStatus } from "@/src/types";

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
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
  const [selectedInvoiceReq, setSelectedInvoiceReq] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "analytics" | "users" | "chat">("requests");
  
  // Advanced Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [notification, setNotification] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'request' | 'account' | 'balanceRequest';
    data: any;
  }>({
    isOpen: false,
    type: 'request',
    data: null
  });

  const [rate, setRate] = useState<number>(165);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+977-9843398340");
  const [pageRoleInfo, setPageRoleInfo] = useState<string>("fb.com/admin_profile");
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>([
    "All Platforms",
    "Facebook",
    "Instagram",
    "TikTok",
    "YouTube",
    "Twitter",
    "LinkedIn"
  ]);
  const [adminAlertMessage, setAdminAlertMessage] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUpdateStatus = async (id: string, status: RequestStatus) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    // Optimistic Update
    const previousRequests = [...requests];
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    try {
      const { error } = await supabase
        .from('boost_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      refresh();
      setNotification(`Campaign status updated to ${status}`);
    } catch (error: any) {
      setRequests(previousRequests);
      console.error(error);
      alert(error.message || "Failed to update status.");
    }
  };

  const handleDeleteRequest = (req: any) => {
    setDeleteConfirm({
      isOpen: true,
      type: "request",
      data: req
    });
  };

  const handlePerformDelete = async () => {
    const { type, data } = deleteConfirm;
    if (type !== "account" && !data) return;

    try {
      if (type === "request") {
        const { error } = await supabase
          .from('boost_requests')
          .delete()
          .eq('id', data.id);
        if (error) throw error;
        setNotification("Campaign permanently deleted.");
        refresh();
      } else if (type === "account") {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user!.id);
        if (error) throw error;
        await supabase.auth.signOut();
        router.push('/');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Deletion failed.");
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleApproveBalance = async (requestId: string) => {
    const request = balanceRequests.find((r) => r.id === requestId);
    if (!request) return;

    try {
      const { error } = await supabase
        .from('balance_requests')
        .update({ status: "Approved" })
        .eq('id', requestId);

      if (error) throw error;

      setNotification("Top-up request approved successfully!");
      refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to approve top-up.");
    }
  };

  const stats = useMemo(
    () => ({
      total: requests.length,
      approved: requests.filter((r) => r.status === "Approved").length,
      pending: requests.filter((r) => r.status === "Pending").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = (req.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (req.url || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === "All" || req.platforms?.includes(platformFilter);
      const matchesStatus = filterStatus === "All" || req.status === filterStatus;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [requests, searchQuery, platformFilter, filterStatus]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <RotateCw className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading secure dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <Navbar profile={profile} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* Banner Alert */}
        {adminAlertMessage && (
          <div className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-600/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="animate-pulse" />
              <span className="text-sm font-bold">{adminAlertMessage}</span>
            </div>
          </div>
        )}

        {/* Info Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mt-1">
              Welcome back, <span className="text-indigo-600 font-bold">{profile.username}</span>! Manage your social growth efficiently.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {profile.role === "Admin" && (
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm text-slate-600 dark:text-zinc-300 hover:scale-105 transition-all"
              >
                <Settings size={20} />
              </button>
            )}
            <button 
              onClick={() => setIsLoadMoneyModalOpen(true)}
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <CreditCard size={18} /> Load Balance
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus size={18} /> New Campaign
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Current Balance" value={`रू ${profile.balance?.toLocaleString() || 0}`} icon={<Wallet size={24} />} color="emerald" />
          <StatCard title="Total Campaigns" value={stats.total} icon={<LayoutDashboard size={24} />} color="indigo" />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 size={24} />} color="emerald" />
          <StatCard title="Pending Review" value={stats.pending} icon={<Clock size={24} />} color="amber" />
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800">
          {(['requests', 'analytics', 'users'] as const).map((tab) => {
            if (tab === 'users' && profile.role !== 'Admin') return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-6 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none"
                >
                  <option value="All">All Platforms</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-6 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Table */}
              <BoostRequestTable 
                requests={filteredRequests} 
                profile={profile} 
                onUpdateStatus={handleUpdateStatus} 
                onDelete={handleDeleteRequest} 
                loading={dataLoading} 
              />
            </div>
          )}

          {activeTab === "analytics" && (
            <Analytics requests={requests} />
          )}

          {activeTab === "users" && profile.role === "Admin" && (
            <AdminUserManagement />
          )}
        </div>
      </main>

      {/* Modals */}
      <BoostRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        profile={profile} 
        user={user} 
        rate={rate} 
        editingRequestId={null} 
        onSuccess={(msg) => setNotification(msg)} 
        requests={requests} 
      />

      <BalanceTopUpModal 
        isOpen={isLoadMoneyModalOpen} 
        onClose={() => setIsLoadMoneyModalOpen(false)} 
        profile={profile} 
        user={user} 
        onSuccess={(msg) => setNotification(msg)} 
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
        onUpdateRate={(val) => setRate(val)} 
        onUpdateWhatsApp={(val) => setWhatsappNumber(val)} 
        onUpdatePageRole={(val) => setPageRoleInfo(val)} 
        onUpdateAllowedPlatforms={(val) => setAllowedPlatforms(val)} 
        onUpdateAlert={(val) => setAdminAlertMessage(val)} 
        onUpdateInvoiceConfig={() => {}} 
      />

      {/* Notification popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[200] bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest border border-white/10 dark:border-slate-100"
          >
            <CheckCircle2 className="text-emerald-500 animate-pulse" size={18} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: 'request', data: null })}
        onConfirm={handlePerformDelete}
        title={deleteConfirm.type === 'request' ? 'Permanently Delete Boost Campaign?' : 'Deactivate & Delete Account?'}
        message={deleteConfirm.type === 'request' ? 'Are you sure you want to delete this campaign? If approved, balance refunds are handled automatically.' : 'This action is irreversible and deletes your full profile records.'}
      />
    </div>
  );
}
