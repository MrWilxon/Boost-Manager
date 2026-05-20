import React, { useState, useMemo, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  LayoutDashboard,
  AlertCircle,
  Rocket,
  Globe,
  Users2,
  Wallet,
  Archive,
  BarChart2,
  PieChart as PieChartIcon,
  Settings,
  Tag,
  Trash2,
  Download,
  Eye,
  Edit,
  Zap,
  RotateCw,
  Facebook,
  Copy,
  History,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
  deleteDoc,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  limitToLast,
  endBefore,
  increment,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { updatePassword } from "firebase/auth";
import { handleFirestoreError, OperationType } from "../utils/errorHandlers";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Navbar } from '../components/layout/Navbar';
import { Analytics } from "../components/dashboard/Analytics";
import { AdminUserManagement } from "../components/dashboard/AdminUserManagement";
import { AdminLocationManagement } from "../components/dashboard/AdminLocationManagement";
import { BoostRequestTable } from "../components/dashboard/BoostRequestTable";
import { BalanceRequestTable } from "../components/dashboard/BalanceRequestTable";
import { AdminSettings } from "../components/dashboard/AdminSettings";
import { BoostRequestModal } from "../components/modals/BoostRequestModal";
import { BalanceTopUpModal } from "../components/modals/BalanceTopUpModal";
import { InvoiceGenerator } from "../components/dashboard/InvoiceGenerator";
import { 
  StatCard, 
  StatusBadge 
} from "../components/dashboard/shared/DashboardComponents";
import { CardSkeleton, TableRowSkeleton } from "../components/common/Skeleton";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { useDashboardData } from "../hooks/useDashboardData";
import { APP_CONFIG, ALL_PLATFORMS } from "../constants";
import { BoostRequest, BalanceRequest, RequestStatus } from "../types";
import { deleteRequest } from "../services/requestService";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// --- Types ---
// Moved to src/types/index.ts

interface DashboardProps {
  defaultTab?: "requests" | "analytics" | "users" | "chat";
}

export default function Dashboard({ defaultTab }: DashboardProps) {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const { 
    requests, 
    balanceRequests, 
    loading, 
    loadingMore, 
    currentPage, 
    hasMore, 
    paginate,
    setRequests,
    setBalanceRequests
  } = useDashboardData(user as any, profile as any, itemsPerPage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadMoneyModalOpen, setIsLoadMoneyModalOpen] = useState(false);
  const [isTextFormatModalOpen, setIsTextFormatModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedInvoiceReq, setSelectedInvoiceReq] = useState<any>(null);
  const [isDataSaver, setIsDataSaver] = useState(() => {
    return localStorage.getItem("data_saver") === "true";
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "requests" | "analytics" | "users" | "chat"
  >(defaultTab || "requests");
  
  // Advanced Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [budgetRange, setBudgetRange] = useState({ min: "", max: "" });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [allRequestsForAnalytics, setAllRequestsForAnalytics] = useState<any[]>(
    [],
  );
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const filteredRequestsForAnalytics = useMemo(() => {
    let filtered = allRequestsForAnalytics;
    if (startDate) {
      filtered = filtered.filter((req) => req.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((req) => req.date <= endDate);
    }
    return filtered;
  }, [allRequestsForAnalytics, startDate, endDate]);

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [previewRequestId, setPreviewRequestId] = useState<string | null>(null);
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [editRemarksValue, setEditRemarksValue] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [notification, setNotification] = useState<string | null>(null);
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'request' | 'account' | 'balanceRequest';
    data: any;
  }>({
    isOpen: false,
    type: 'request',
    data: null
  });

  // Balance History Filtering States
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyAmountFilter, setHistoryAmountFilter] = useState("");
  const [historyDateStart, setHistoryDateStart] = useState("");
  const [historyDateEnd, setHistoryDateEnd] = useState("");

  useEffect(() => {
    const handleViewHistory = (e: any) => {
      const username = e.detail.username;
      setShowBalanceHistory(true);
      setHistorySearchQuery(username);
      // Scroll to history section
      const historySection = document.getElementById("balance-history-section");
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('view-user-history', handleViewHistory);
    return () => window.removeEventListener('view-user-history', handleViewHistory);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [rate, setRate] = useState<number | null>(() => {
    const saved = localStorage.getItem("exchange_rate");
    return saved ? Number(saved) : null;
  });
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
  const [hasDismissedAlert, setHasDismissedAlert] = useState<boolean>(false);
  const [invoiceConfig, setInvoiceConfig] = useState({
    companyName: "BOOST MANAGER",
    companySubtitle: "Digital Solutions",
    billToLocation: "KATHMANDU, NEPAL"
  });

  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Modal states & selections
  const [modalBudget, setModalBudget] = useState(5);
  const [modalDuration, setModalDuration] = useState(5);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["All Platforms"]);
  const [modalUrl, setModalUrl] = useState("");

  const [modalLocations, setModalLocations] = useState<string[]>(["All Nepal"]);
  const [customLocation, setCustomLocation] = useState("");
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [recentLocations, setRecentLocations] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("recent_locations") || "[]");
  });

  const [modalGender, setModalGender] = useState("Both");
  const [modalAge, setModalAge] = useState("18-65");
  const [customAge, setCustomAge] = useState("");
  const [isCustomAge, setIsCustomAge] = useState(false);

  const [isPromoVisible, setIsPromoVisible] = useState(false);
  const [modalAdGoal, setModalAdGoal] = useState("Get Message");
  const [modalDestination, setModalDestination] = useState("Messenger");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSubmitError, setModalSubmitError] = useState<string | null>(null);

  // Promo & Rate States
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  // Admin Create Promo States
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoType, setNewPromoType] = useState<
    "percentage" | "fixed" | "rate_override"
  >("percentage");
  const [newPromoValue, setNewPromoValue] = useState(0);
  const [newPromoTarget, setNewPromoTarget] = useState("");

  // Destination Options mapping
  const goalDestinations: Record<string, string[]> = {
    "Get Message": ["Messenger", "WhatsApp", "Instagram DM"],
    "Page Likes": ["Facebook Page"],
    "Post Engagement": ["Facebook Post", "Instagram Post"],
    "Website Visits": ["Website Link"],
  };

  useEffect(() => {
    const defaultForGoal = goalDestinations[modalAdGoal]?.[0];
    if (
      defaultForGoal &&
      !goalDestinations[modalAdGoal].includes(modalDestination)
    ) {
      setModalDestination(defaultForGoal);
    }
  }, [modalAdGoal]);

  // Sync Rate & Promo Codes from Firestore
  useEffect(() => {
    // Sync Global Rate
    const unsubRate = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.value) {
          setRate(data.value);
          localStorage.setItem("exchange_rate", String(data.value));
        }
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        if (data.pageRoleInfo) setPageRoleInfo(data.pageRoleInfo);
        if (data.allowedPlatforms) setAllowedPlatforms(data.allowedPlatforms);
        if (data.adminAlertMessage !== undefined) setAdminAlertMessage(data.adminAlertMessage);
        if (data.invoiceConfig) setInvoiceConfig(data.invoiceConfig);
      }
    });

    // Sync Promo Codes (Admins see all, Users see public ones)
    // Actually, for simplicity, users don't need to sync all. They validate on-demand.
    // But admins need them for management.
    let unsubPromos: any = () => {};
    if (profile?.role === "Admin") {
      unsubPromos = onSnapshot(collection(db, "promoCodes"), (snap) => {
        setPromoCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubRate();
      unsubPromos();
    };
  }, [profile?.role]);

  // Data fetching handled by useDashboardData hook

  // Fetch more data for analytics when tab switches
  useEffect(() => {
    if (activeTab === "analytics" && user && profile) {
      const fetchAnalyticsData = async () => {
        setLoadingAnalytics(true);
        try {
          const baseQuery =
            profile.role === "Admin"
              ? collection(db, "requests")
              : query(
                  collection(db, "requests"),
                  where("userId", "==", user.uid),
                );

          // Get more records for analytics (e.g., last 500 approved/rejected)
          const q = query(baseQuery, orderBy("createdAt", "desc"), limit(500));
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map((snap) => ({
            id: snap.id,
            ...(snap.data() as object),
          }));
          setAllRequestsForAnalytics(docs);
        } catch (error) {
          console.error("Error fetching analytics data:", error);
        } finally {
          setLoadingAnalytics(false);
        }
      };

      fetchAnalyticsData();
    }
  }, [activeTab, user?.uid, profile?.role]);

  // Paginate handled by useDashboardData hook

  const handleUpdateStatus = async (id: string, status: RequestStatus) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    // Optimistic Update
    const previousRequests = [...requests];
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );

    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "requests", id);
        
        let balanceChange = 0; // Positive means refund to user, negative means deduct from user
        const isCurrentlyRefunded = req.status === "Rejected";
        const willBeRefunded = status === "Rejected";

        if (isCurrentlyRefunded && !willBeRefunded) {
          // Changed from Rejected to Pending/Approved -> need to deduct balance
          balanceChange = -(req.amountNpr || 0);
        } else if (!isCurrentlyRefunded && willBeRefunded) {
          // Changed from Pending/Approved to Rejected -> need to refund balance
          balanceChange = req.amountNpr || 0;
        }

        if (balanceChange !== 0) {
          const userRef = doc(db, "users", req.userId);
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User does not exist");
          
          const currentBalance = userDoc.data().balance || 0;
          if (balanceChange < 0 && currentBalance < Math.abs(balanceChange)) {
            throw new Error("Insufficient balance");
          }
          transaction.update(userRef, { balance: currentBalance + balanceChange });
        }
        
        transaction.update(reqRef, { status });
      });
      
      if (status === "Rejected" && req.status !== "Rejected") {
        alert("Request rejected and balance refunded to user.");
      } else if (req.status === "Rejected" && status !== "Rejected") {
        alert("Request status restored and balance deducted.");
      } else if (status === "Approved" && req.status !== "Approved") {
        alert("Boost approved successfully.");
      }
    } catch (error) {
      setRequests(previousRequests); // Rollback
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  };

  const handleUpdateRemarks = async (id: string, remarks: string) => {
    try {
      await updateDoc(doc(db, "requests", id), { remarks });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${id}`);
    }
  };

  const handleDeleteRequest = (req: any) => {
    setDeleteConfirm({
      isOpen: true,
      type: "request",
      data: req
    });
  };

  const handleDeleteAccount = () => {
    if (!user || !profile) return;
    
    if (profile.balance > 0) {
      alert(`Account deletion rejected. You have a remaining balance of NPR ${profile.balance.toLocaleString()}. Please use your balance or contact support before deleting your account.`);
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      type: "account",
      data: null
    });
  };

  const handlePerformDelete = async () => {
    const { type, data } = deleteConfirm;
    if (type !== "account" && !data) return;

    try {
      if (type === "request") {
        const req = data;
        await deleteRequest(req.id);
        setNotification("Request permanently deleted.");
      } else if (type === "account") {
        // Delete user record
        await deleteDoc(doc(db, "users", user!.uid));
        
        // Clear local cache
        localStorage.removeItem("exchange_rate");
        localStorage.removeItem("data_saver");
        localStorage.removeItem("recent_locations");

        setNotification("Account deleted. Relogging...");
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error: any) {
      console.error(`Error performing ${type} deletion:`, error);
      alert(error?.message || "Failed to complete deletion");
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const startEditing = (req: any) => {
    setEditingRequestId(req.id);
    setModalUrl(req.url);
    setSelectedPlatforms(req.platforms);
    setModalLocations(req.location ? req.location.split(", ") : ["All Nepal"]);
    setModalGender(req.gender);
    setModalAge(req.age);
    setModalAdGoal(req.adGoal);
    setModalDestination(req.destination);
    setModalBudget(req.allocatedBudget);
    setModalDuration(req.duration);
    setModalNotes(req.notes);
    setIsModalOpen(true);
  };

  const handleApproveBalance = async (requestId: string) => {
    const request = balanceRequests.find((r) => r.id === requestId);
    if (!request) return;

    // Optimistic Update
    setBalanceRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "Approved" } : r)),
    );

    try {
      await updateDoc(doc(db, "balanceRequests", requestId), {
        status: "Approved",
        approvedBy: user?.uid,
        approvedAt: serverTimestamp()
      });
      const userRef = doc(db, "users", request.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentBalance = userSnap.data().balance || 0;
        await updateDoc(userRef, { balance: currentBalance + request.amount });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `balanceRequests/${requestId}`,
      );
    }
  };

  const generateTextFormat = () => {
    const daily = modalDuration > 0 ? (modalBudget / modalDuration).toFixed(2) : "0.00";
    return `
🚀 BOOST REQUEST

🔗 Post URL:
${modalUrl || "N/A"}

💰 Total Budget: $${modalBudget}
📅 Duration: ${modalDuration} Days
💵 Daily: $${daily}/day
🇳🇵 Total: रू ${eligibility.totalNpr.toLocaleString()}

📍 Location: ${modalLocations.join(", ")}
👥 Gender: ${modalGender}
🔞 Age: ${modalAge}

📱 Platform: ${selectedPlatforms.join(", ")}
🎯 Goal: ${modalAdGoal}
📩 Destination: ${modalDestination}
📝 Notes: ${modalNotes || "None"}
    `.trim();
  };

  const formatRequestText = (req: any) => {
    const daily = req.duration > 0 ? (req.allocatedBudget / req.duration).toFixed(2) : "0.00";
    return `
🚀 BOOST REQUEST

🔗 Post URL:
${req.url || "N/A"}

💰 Total Budget: $${req.allocatedBudget}
📅 Duration: ${req.duration} Days
💵 Daily: $${daily}/day
🇳🇵 Total: रू ${req.amountNpr?.toLocaleString()}

📍 Location: ${req.location}
👥 Gender: ${req.gender}
🔞 Age: ${req.age}

📱 Platform: ${req.platforms?.join(", ")}
🎯 Goal: ${req.adGoal}
📩 Destination: ${req.destination}
📝 Notes: ${req.notes || "None"}${req.remarks ? `\n🗣️ Remarks: ${req.remarks}` : ""}
    `.trim();
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

  const eligibility = useMemo(() => {
    const currentRate = rate || 165;
    let effectiveRate = currentRate;
    let discountPercent = 0;
    let fixedDiscount = 0;

    if (appliedPromo) {
      if (appliedPromo.discountType === "rate_override") {
        effectiveRate = appliedPromo.value;
      } else if (appliedPromo.discountType === "percentage") {
        discountPercent = appliedPromo.value;
      } else if (appliedPromo.discountType === "fixed") {
        fixedDiscount = appliedPromo.value;
      }
    }

    const totalBudget = modalBudget;
    const dailyBudget = modalDuration > 0 ? totalBudget / modalDuration : 0;

    const baseNpr = totalBudget * effectiveRate;
    const discountedNpr = baseNpr * (1 - discountPercent / 100) - fixedDiscount;
    const totalNpr = Math.max(0, Math.floor(discountedNpr));

    const balance = profile?.balance || 0;

    const warnings: { type: "error" | "warning" | "info"; message: string }[] =
      [];

    // Technical/Blocking Errors
    if (totalNpr > balance) {
      warnings.push({
        type: "error",
        message: `Insufficient balance. Cost: रू${totalNpr.toLocaleString()} | Balance: रू${balance.toLocaleString()}`,
      });
    }

    if (totalBudget <= 0) {
      warnings.push({
        type: "error",
        message: "Budget must be greater than $0.",
      });
    }

    if (dailyBudget < 2) {
      warnings.push({
        type: "error",
        message: `Min budget is $2/day. For ${modalDuration} days, total must be at least $${modalDuration * 2}.`,
      });
    }

    if (modalDuration < 1) {
      warnings.push({
        type: "error",
        message: "Duration must be at least 1 day.",
      });
    }

    if (!modalUrl.trim()) {
      warnings.push({ type: "error", message: "Campaign URL is required." });
    } else if (!modalUrl.startsWith("http")) {
      warnings.push({
        type: "error",
        message: "Invalid URL format. Include http:// or https://",
      });
    }

    if (modalLocations.length === 0) {
      warnings.push({
        type: "error",
        message: "Please select/specify at least one location.",
      });
    }

    if (isCustomAge && !customAge.trim()) {
      warnings.push({
        type: "error",
        message: "Please specify your custom age group.",
      });
    }

    // Logical Operational Warnings (Not necessarily blocking, but advisory)
    if (dailyBudget < 1) {
      warnings.push({
        type: "warning",
        message: `Extremely low daily budget ($${dailyBudget.toFixed(2)}). Results may be limited.`,
      });
    } else if (dailyBudget < 3) {
      warnings.push({
        type: "info",
        message: `Daily budget of $${dailyBudget} is okay, but $3-5 is recommended for better optimization.`,
      });
    }

    if (modalDuration < 4) {
      warnings.push({
        type: "warning",
        message:
          "Campaigns shorter than 4 days often don't have enough time to exit the 'Learning Phase'.",
      });
    }

    // Goal vs Platform Logical Validation
    if (
      modalAdGoal === "Page Likes" &&
      selectedPlatforms.includes("Instagram") &&
      !selectedPlatforms.includes("Facebook")
    ) {
      warnings.push({
        type: "warning",
        message:
          "'Page Likes' is primarily a Facebook feature. Performance on Instagram for this goal may be poor.",
      });
    }

    return {
      isEligible: !warnings.some((w) => w.type === "error"),
      hasSeriousWarnings: warnings.some(
        (w) => w.type === "error" || w.type === "warning",
      ),
      warnings,
      totalNpr,
      effectiveRate,
      discountApplied:
        discountPercent > 0 || fixedDiscount > 0 || effectiveRate !== rate,
    };
  }, [
    modalBudget,
    modalDuration,
    rate,
    profile?.balance,
    modalUrl,
    modalAdGoal,
    selectedPlatforms,
    isCustomLocation,
    customLocation,
    isCustomAge,
    customAge,
    appliedPromo,
  ]);

  const generateInvoice = async (req: any) => {
    setSelectedInvoiceReq(req);
  };

  useEffect(() => {
    if (!selectedInvoiceReq) return;

    const performGeneration = async () => {
      const element = document.getElementById("invoice-generator-container");
      if (!element) {
        console.error("Invoice generator container not found");
        setSelectedInvoiceReq(null);
        return;
      }

      try {
        setNotification("Preparing your professional invoice...");
        // Wait for React to finish rendering the single template with new data
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(element, {
          scale: 2, 
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          scrollY: 0,
          onclone: (clonedDoc) => {
            // BEST FIX: Aggressively strip oklch from all style definitions in the cloned document
            // html2canvas fails when it tries to parse these modern color functions
            
            // 1. Sanitize all <style> tags
            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styleTags.length; i++) {
              const tag = styleTags[i];
              if (tag.innerHTML.includes('oklch')) {
                // Replace any oklch(...) function with a safe hex color
                tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#4b5563'); 
              }
            }

            // 2. Sanitize all inline styles on elements
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              if (el.getAttribute('style')?.includes('oklch')) {
                const newStyle = el.getAttribute('style')!.replace(/oklch\([^)]+\)/g, '#4b5563');
                el.setAttribute('style', newStyle);
              }
            }

            // 3. Ensure the generator container is visible in the clone
            const target = clonedDoc.getElementById("invoice-generator-container");
            if (target) {
              target.style.position = 'relative';
              target.style.left = '0';
              target.style.display = 'block';
              target.style.visibility = 'visible';
              target.style.opacity = '1';
            }
          }
        });

        if (!canvas || canvas.width === 0) {
          throw new Error("Canvas generation failed: Empty canvas.");
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.85); 
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2],
          compress: true 
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2, undefined, 'FAST');
        pdf.save(`Invoice_${String(selectedInvoiceReq.id).slice(0, 8)}.pdf`);
        setNotification("Invoice generated successfully!");
      } catch (error: any) {
        console.error("Error generating invoice:", error);
        alert(`Failed to generate invoice: ${error.message || "Unknown error"}`);
      } finally {
        setSelectedInvoiceReq(null);
      }
    };

    performGeneration();
  }, [selectedInvoiceReq]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (filterStatus !== "All" && req.status !== filterStatus) {
        return false;
      }
      // Platform filter
      if (platformFilter !== "All" && !req.platforms?.includes(platformFilter)) {
        return false;
      }
      // Budget range
      if (budgetRange.min && req.allocatedBudget < Number(budgetRange.min)) {
        return false;
      }
      if (budgetRange.max && req.allocatedBudget > Number(budgetRange.max)) {
        return false;
      }
      // Date range
      if (startDate && req.date < startDate) {
        return false;
      }
      if (endDate && req.date > endDate) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUsername = req.username?.toLowerCase().includes(query);
        const matchesUrl = req.url?.toLowerCase().includes(query);
        const matchesId = req.id.toLowerCase().includes(query);
        const matchesGoal = req.adGoal?.toLowerCase().includes(query);
        if (!matchesUsername && !matchesUrl && !matchesId && !matchesGoal) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filterStatus, searchQuery, platformFilter, budgetRange, startDate, endDate]);

  // Pagination removal of old memoized list
  const paginatedRequests = filteredRequests;

  const filteredBalanceRequests = useMemo(() => {
    return balanceRequests.filter((req) => {
      // User/Search filter
      if (historySearchQuery) {
        const query = historySearchQuery.toLowerCase();
        const matchesUser = req.username?.toLowerCase().includes(query) || req.userId?.toLowerCase().includes(query);
        if (!matchesUser) return false;
      }

      // Status filter
      if (historyStatusFilter !== "All" && req.status !== historyStatusFilter) {
        return false;
      }

      // Amount filter
      if (historyAmountFilter && req.amount < Number(historyAmountFilter)) {
        return false;
      }

      // Date range filter
      if (historyDateStart && req.date < historyDateStart) {
        return false;
      }
      if (historyDateEnd && req.date > historyDateEnd) {
        return false;
      }

      return true;
    });
  }, [balanceRequests, historySearchQuery, historyStatusFilter, historyAmountFilter, historyDateStart, historyDateEnd]);

  // Removed early return for loading to support skeletal states

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    try {
      const promoId = promoCode.trim().toUpperCase();
      const promoRef = doc(db, "promoCodes", promoId);
      const snap = await getDoc(promoRef);
      if (!snap.exists()) {
        setPromoError("Invalid promo code");
        setAppliedPromo(null);
      } else {
        const promoData = snap.data();
        if (promoData.targetUserId && promoData.targetUserId !== user?.uid) {
          setPromoError("This promo code is not valid for your account.");
          setAppliedPromo(null);
        } else {
          setAppliedPromo(promoData);
          setPromoError("");
        }
      }
    } catch (error) {
      console.error("Error validating promo:", error);
      alert("Error validating promo code");
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleAdminUpdateRate = async (newVal: number) => {
    try {
      await setDoc(
        doc(db, "settings", "global"),
        {
          value: newVal,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      alert("Rate updated globally!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  const handleAdminUpdateWhatsApp = async (newVal: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { whatsappNumber: newVal, updatedAt: serverTimestamp() }, { merge: true });
      alert("WhatsApp Number updated!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  const handleAdminUpdatePageRole = async (newVal: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { pageRoleInfo: newVal, updatedAt: serverTimestamp() }, { merge: true });
      alert("Page Role Link updated!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  const handleAdminUpdateAllowedPlatforms = async (newVal: string[]) => {
    try {
      await setDoc(doc(db, "settings", "global"), { allowedPlatforms: newVal, updatedAt: serverTimestamp() }, { merge: true });
      alert("Allowed Platforms updated!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  const handleAdminUpdateAlert = async (message: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { adminAlertMessage: message, updatedAt: serverTimestamp() }, { merge: true });
      alert("Admin Alert updated!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  const handleAdminUpdateInvoiceConfig = async (config: any) => {
    try {
      await setDoc(doc(db, "settings", "global"), { invoiceConfig: config, updatedAt: serverTimestamp() }, { merge: true });
      alert("Invoice Settings updated!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
    }
  };

  // handleDeleteAccount logic handled by handlePerformDelete


  const handleAdminCreatePromo = async () => {
    if (!newPromoCode || newPromoValue <= 0) return;
    try {
      const codeId = newPromoCode.toUpperCase();
      await setDoc(doc(db, "promoCodes", codeId), {
        code: codeId,
        discountType: newPromoType,
        value: newPromoValue,
        targetUserId: newPromoTarget || null,
        createdAt: serverTimestamp(),
      });
      setNewPromoCode("");
      setNewPromoValue(0);
      setNewPromoTarget("");
      alert("Promo code created!");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "promoCodes");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 transition-colors">
      <Navbar
        balance={profile?.balance || 0}
        onLoadMoney={() => setIsLoadMoneyModalOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
      />

      <AnimatePresence>
        {adminAlertMessage && !hasDismissedAlert && profile?.role !== "Admin" && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setHasDismissedAlert(true)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white dark:bg-zinc-950 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-zinc-800 ring-1 dark:ring-white/10 text-center"
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Important Announcement
              </h2>
              <p className="text-slate-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed mb-8 whitespace-pre-wrap">
                {adminAlertMessage}
              </p>
              <button
                onClick={() => setHasDismissedAlert(true)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                Dismiss & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        {profile?.role === "User" && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 md:p-6 mb-6">
            <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 text-center xs:text-left">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 mt-1 shrink-0">
                <Facebook size={24} />
              </div>
              <div className="flex-1 w-full">
                <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">Facebook Page Role Setup</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                  Please provide <strong className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Full Access</strong> to the following profile for your Facebook Page. 
                  This is necessary to allow the admin full control to quickly modify and optimize your campaign settings. It is more logical and good for admin purposes, making the work very fast and easy.
                </p>
                <div className="flex flex-col xs:flex-row items-center xs:items-start gap-2">
                  <span className="inline-block w-full xs:w-auto text-[10px] sm:text-xs font-mono bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 select-all border-dashed truncate max-w-full xs:max-w-xs">
                    {pageRoleInfo || "fb.com/admin_profile"}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(pageRoleInfo || "fb.com/admin_profile");
                      alert("Copied to clipboard!");
                    }}
                    className="w-full xs:w-auto flex items-center justify-center p-2 bg-white dark:bg-zinc-900 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-slate-200 dark:border-zinc-800 rounded-lg text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                    title="Copy Link"
                  >
                    <Copy size={16} className="xs:hidden mr-2" />
                    <Copy size={14} className="hidden xs:block" />
                    <span className="xs:hidden text-xs font-bold uppercase tracking-widest">Copy Profile Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-zinc-100">
              {profile?.role} Dashboard
            </h2>
            <span className="text-slate-600 dark:text-zinc-300 text-sm">
              Welcome back, {profile?.username}
            </span>

            {/* Tab Switcher */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="flex bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "requests"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <LayoutDashboard size={14} /> Requests
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "analytics"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <PieChartIcon size={14} /> Analytics
                </button>
                {profile?.role === "Admin" && (
                  <>
                    <button
                      onClick={() => setActiveTab("users")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "users"
                          ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-zinc-100"
                      }`}
                    >
                      <Users2 size={14} /> Users
                    </button>
                  </>
                )}
              </div>

              {profile?.role === "Admin" && (
                <button
                  onClick={() => setIsAdminSettingsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs border border-orange-500/20 hover:bg-orange-500/20 transition-all ml-0 sm:ml-2"
                >
                  <Settings size={14} /> Admin Tools
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-[2]">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title={
                    profile?.role === "Admin" ? "Total Assets" : "My Requests"
                  }
                  value={stats.total}
                  icon={BarChart3}
                  color="zinc-400"
                />
                <StatCard
                  title="Approved"
                  value={stats.approved}
                  icon={CheckCircle2}
                  color="emerald-500"
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={Clock}
                  color="amber-500"
                />
                <StatCard
                  title="Rejected"
                  value={stats.rejected}
                  icon={XCircle}
                  color="red-500"
                />
              </>
            )}
          </div>
        </div>

        {activeTab === "requests" ? (
          <>
            <BoostRequestTable
              requests={paginatedRequests as BoostRequest[]}
              loading={loading}
              profile={profile as any}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onUpdateStatus={handleUpdateStatus}
              onUpdateRemarks={handleUpdateRemarks}
              onDeleteRequest={handleDeleteRequest}
              onGenerateInvoice={generateInvoice}
              onPreviewRequest={setPreviewRequestId}
              onStartEditing={startEditing}
              onPaginate={paginate}
              onSetItemsPerPage={setItemsPerPage}
              onSetEditingRemarks={(id, val) => {
                setEditingRemarksId(id);
                setEditRemarksValue(val);
              }}
            />
          </>
        ) : activeTab === "analytics" ? (
          <ErrorBoundary>
            <div className="pb-10">
            {loadingAnalytics ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
                  Crunching your numbers...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm text-slate-800 dark:text-zinc-100"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <Analytics
                  requests={filteredRequestsForAnalytics}
                  role={profile?.role}
                />
              </div>
            )}
          </div>
          </ErrorBoundary>
        ) : activeTab === "users" && profile?.role === "Admin" ? (
          <AdminUserManagement />
        ) : null}

        <BalanceRequestTable
          requests={filteredBalanceRequests as BalanceRequest[]}
          profile={profile as any}
          showHistory={showBalanceHistory}
          onToggleHistory={() => {
            setShowBalanceHistory(!showBalanceHistory);
            if (!showBalanceHistory) {
              setHistoryStatusFilter("All");
            } else {
              setHistoryStatusFilter("Pending");
            }
          }}
          onApprove={handleApproveBalance}
          onReject={async (requestId) => {
             try {
                await updateDoc(doc(db, "balanceRequests", requestId), { 
                   status: "Rejected",
                   approvedBy: user?.uid,
                   approvedAt: serverTimestamp()
                });
             } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `balanceRequests/${requestId}`);
             }
          }}
          searchQuery={historySearchQuery}
          onSearchChange={setHistorySearchQuery}
          statusFilter={historyStatusFilter}
          onStatusFilterChange={setHistoryStatusFilter}
          amountFilter={historyAmountFilter}
          onAmountFilterChange={setHistoryAmountFilter}
          dateStart={historyDateStart}
          onDateStartChange={setHistoryDateStart}
          dateEnd={historyDateEnd}
          onDateEndChange={setHistoryDateEnd}
        />
        <DeleteConfirmationModal 
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handlePerformDelete}
          title={deleteConfirm.type === 'account' ? 'Delete Account Permanently?' : 'Delete Request Permanently?'}
          message={deleteConfirm.type === 'account' 
            ? 'Are you sure you want to delete your account? This will remove all your data.' 
            : 'Are you sure you want to delete this boost request and all its information?'}
        />
      </main>

      {/* New Boost Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-zinc-950 p-6 md:p-8 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-zinc-800 ring-1 dark:ring-white/5 my-4 sm:my-10 z-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Create Boost Request
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-500 text-sm mt-1">
                    Enter ad details for a boost.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
                onSubmit={async (e) => {
                  e.preventDefault();

                  setModalSubmitError(null);
                  if (!eligibility.isEligible) {
                    const errorMessages = eligibility.warnings
                      .filter((w) => w.type === "error")
                      .map((w) => w.message);
                    alert(
                      `Cannot submit request:\n${errorMessages.join("\n")}`,
                    );
                    return;
                  }

                  setIsSubmittingRequest(true);
                  if (!user?.uid || !profile?.username) {
                    alert("You must be logged in to submit a request.");
                    setIsSubmittingRequest(false);
                    return;
                  }
                  
                  const currentRate = rate || 165;
                  const totalNpr = modalBudget * modalDuration * currentRate;
                  
                  try {
                    const finalLocation = modalLocations.join(", ");
                    const finalAge = isCustomAge ? customAge : modalAge;
                    
                    const newReq: Record<string, unknown> = {
                      userId: user.uid,
                      username: profile.username,
                      url: modalUrl,
                      platforms: selectedPlatforms,
                      location: finalLocation,
                      gender: modalGender,
                      age: finalAge,
                      adGoal: modalAdGoal,
                      destination: modalDestination,
                      allocatedBudget: modalBudget,
                      duration: modalDuration,
                      amountNpr: totalNpr,
                      status: "Pending",
                      date: new Date().toISOString().slice(0, 10),
                      createdAt: serverTimestamp(),
                      ...(modalNotes?.trim() ? { notes: modalNotes.trim() } : {}),
                    };

                    let message = "";
                    if (editingRequestId) {
                      await updateDoc(doc(db, "requests", editingRequestId), newReq);
                      message = "Boost request updated successfully!";
                    } else {
                      const userRef = doc(db, "users", user.uid);
                      const userSnap = await getDoc(userRef);
                      const currentBalance = userSnap.data()?.balance ?? 0;

                      if (currentBalance < totalNpr) {
                        setModalSubmitError(
                          `Insufficient balance. You need NPR ${totalNpr.toLocaleString()} but only have NPR ${currentBalance.toLocaleString()}. Please top up your balance first.`
                        );
                        setIsSubmittingRequest(false);
                        return;
                      }

                      let reqCreated = false;
                      try {
                        await addDoc(collection(db, "requests"), newReq);
                        reqCreated = true;
                      } catch (err) {
                        console.error("Error creating request doc:", err);
                        handleFirestoreError(err, OperationType.CREATE, "requests");
                        return;
                      }
                      
                      try {
                        await updateDoc(userRef, {
                          balance: currentBalance - totalNpr,
                        });
                      } catch (err) {
                        console.error("Error updating user balance:", err);
                        handleFirestoreError(err, OperationType.UPDATE, "users/balance_decrement");
                        return;
                      }
                      message = "Successfully submitted request";
                    }

                    // Update recent locations
                    // Update recent locations (all selected)
                    const updatedRecent = [...recentLocations];
                    modalLocations.forEach(loc => {
                      if (!updatedRecent.includes(loc)) {
                        updatedRecent.unshift(loc);
                      }
                    });
                    const finalRecent = updatedRecent.slice(0, 5);
                    setRecentLocations(finalRecent);
                    localStorage.setItem("recent_locations", JSON.stringify(finalRecent));

                    // Delay notification slightly to ensure it renders reliably after modal start closing
                    setTimeout(() => {
                      setNotification(message);
                    }, 100);
                    setIsModalOpen(false);
                    setEditingRequestId(null);
                  } catch (error) {
                    console.error("Error submitting boost request:", error);
                    setModalSubmitError(
                      error instanceof Error
                        ? error.message
                        : "An unexpected error occurred while submitting.",
                    );
                  } finally {
                    setIsSubmittingRequest(false);
                  }
                }}
              >
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Campaign Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold uppercase tracking-widest text-xs">
                      <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Globe size={14} />
                      </div>
                      Campaign Details
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                        Url to boost
                      </label>
                      <input
                        name="url"
                        required
                        type="url"
                        value={modalUrl}
                        onChange={(e) => setModalUrl(e.target.value)}
                        placeholder="https://facebook.com/posts/..."
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                        Platform
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allowedPlatforms.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              const next = selectedPlatforms.includes(p)
                                ? selectedPlatforms.filter((item) => item !== p)
                                : [...selectedPlatforms, p];
                              setSelectedPlatforms(next.length === 0 ? [allowedPlatforms[0] || "All Platforms"] : next);
                            }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all border ${
                              selectedPlatforms.includes(p)
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-zinc-700"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Filters & Targeting */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold uppercase tracking-widest text-xs">
                      <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Users2 size={14} />
                      </div>
                      Filters & Targeting
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                          Locations
                        </label>
                        <div className="flex flex-col gap-3">
                          {/* Selected Tags */}
                          <div className="flex flex-wrap gap-2 min-h-[32px]">
                            {modalLocations.map((loc) => (
                              <motion.span
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={loc}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-indigo-500/30"
                              >
                                {loc}
                                <button
                                  type="button"
                                  onClick={() => setModalLocations(prev => prev.filter(l => l !== loc))}
                                  className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 rounded-full transition-colors"
                                >
                                  <X size={10} />
                                </button>
                              </motion.span>
                            ))}
                            {modalLocations.length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">No locations selected</span>
                            )}
                          </div>

                          <div className="relative group">
                            <select
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "Custom") {
                                  setIsCustomLocation(true);
                                } else if (val && !modalLocations.includes(val)) {
                                  setModalLocations(prev => [...prev, val]);
                                  setIsCustomLocation(false);
                                }
                              }}
                              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all pr-10 text-xs font-bold"
                            >
                              <option value="" disabled>Add a location...</option>
                              <option>All Nepal</option>
                              <option>Kathmandu</option>
                              <option>Lalitpur</option>
                              <option>Pokhara</option>
                              <option>Butwal</option>
                              <option>Chitwan</option>
                              <option>Biratnagar</option>
                              <option>Dharan</option>
                              <option>Itahari</option>
                              <option>Bhaktapur</option>
                              {recentLocations.filter(loc => !modalLocations.includes(loc)).map((loc) => (
                                <option key={loc} value={loc}>
                                  {loc} (Recent)
                                </option>
                              ))}
                              <option value="Custom">+ Custom Location...</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown size={14} />
                            </div>
                          </div>

                          {isCustomLocation && (
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                placeholder="e.g. Baneshwor..."
                                value={customLocation}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (customLocation.trim() && !modalLocations.includes(customLocation.trim())) {
                                      setModalLocations(prev => [...prev, customLocation.trim()]);
                                      setCustomLocation("");
                                      setIsCustomLocation(false);
                                    } else {
                                      setCustomLocation("");
                                      setIsCustomLocation(false);
                                    }
                                  }
                                }}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-800 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-white text-xs outline-none shadow-sm shadow-indigo-500/10"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (customLocation.trim() && !modalLocations.includes(customLocation.trim())) {
                                    setModalLocations(prev => [...prev, customLocation.trim()]);
                                    setCustomLocation("");
                                    setIsCustomLocation(false);
                                  } else {
                                    setCustomLocation("");
                                    setIsCustomLocation(false);
                                  }
                                }}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-500/20 z-10 relative active:scale-95"
                              >
                                ADD
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={modalGender}
                          onChange={(e) => setModalGender(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                        >
                          <option>Both</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                          Age
                        </label>
                        <div className="flex flex-col gap-2">
                          <select
                            name="age"
                            value={isCustomAge ? "Custom" : modalAge}
                            onChange={(e) => {
                              if (e.target.value === "Custom") {
                                setIsCustomAge(true);
                              } else {
                                setIsCustomAge(false);
                                setModalAge(e.target.value);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                          >
                            <option>18-65</option>
                            <option>18-24</option>
                            <option>25-34</option>
                            <option>35-44</option>
                            <option>45+</option>
                            <option value="Custom">
                              + Custom Age Group...
                            </option>
                          </select>
                          {isCustomAge && (
                            <motion.input
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              placeholder="e.g. 13-17 or 21-30"
                              value={customAge}
                              onChange={(e) => setCustomAge(e.target.value)}
                              className="w-full px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                          Ad Goal
                        </label>
                        <select
                          name="adGoal"
                          value={modalAdGoal}
                          onChange={(e) => setModalAdGoal(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                        >
                          <option>Get Message</option>
                          <option>Page Likes</option>
                          <option>Post Engagement</option>
                          <option>Website Visits</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                        Dest.
                      </label>
                      <select
                        name="destination"
                        value={modalDestination}
                        onChange={(e) => setModalDestination(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                      >
                        {goalDestinations[modalAdGoal].map((dest) => (
                          <option key={dest} value={dest}>
                            {dest}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTextFormatModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-900 transition-all"
                    >
                      <Search size={14} /> Show Text Format
                    </button>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Budget & Payment */}
                  <div className="bg-slate-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold uppercase tracking-widest text-xs">
                      <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Wallet size={14} />
                      </div>
                      Budget & Payment
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                            Total Budget ($)
                          </label>
                          {modalDuration > 0 && modalBudget > 0 && (
                            <span
                              className={`text-[9px] font-bold ${modalBudget / modalDuration < 2 ? "text-rose-500" : "text-slate-500 dark:text-zinc-400"}`}
                            >
                              ${(modalBudget / modalDuration).toFixed(2)}/d
                            </span>
                          )}
                        </div>
                        <input
                          value={modalBudget}
                          onChange={(e) =>
                            setModalBudget(Number(e.target.value))
                          }
                          required
                          type="number"
                          min="1"
                          className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                          Duration (D)
                        </label>
                        <input
                          value={modalDuration}
                          onChange={(e) =>
                            setModalDuration(Number(e.target.value))
                          }
                          required
                          type="number"
                          min="1"
                          className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!isPromoVisible ? (
                        <button
                          type="button"
                          onClick={() => setIsPromoVisible(true)}
                          className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          I have a promo code
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex gap-2 relative">
                            <input
                              placeholder="Promo"
                              value={promoCode}
                              onChange={(e) => { 
                                setPromoCode(e.target.value);
                                setPromoError("");
                              }}
                              className={`flex-1 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border text-slate-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 ${promoError ? "border-rose-500 ring-rose-500" : appliedPromo ? "border-emerald-500/50 ring-emerald-500/10 ring-2" : "border-slate-200 dark:border-zinc-800 focus:ring-indigo-500/50"}`}
                            />
                            <button
                              type="button"
                              onClick={handleApplyPromo}
                              disabled={checkingPromo || !promoCode}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {checkingPromo ? "..." : "APPLY"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPromoVisible(false);
                                setPromoCode("");
                                setAppliedPromo(null);
                                setPromoError("");
                              }}
                              className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white p-3"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          {promoError && <p className="text-xs text-rose-500 font-bold ml-1">{promoError}</p>}
                        </motion.div>
                      )}
                      {appliedPromo && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1 animate-pulse">
                          <Tag size={10} /> Promo Applied: {appliedPromo.code} (
                          {appliedPromo.discountType.replace("_", " ")})
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                          Rate
                        </span>
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold ${eligibility.effectiveRate !== rate ? "text-emerald-600 dark:text-emerald-500 animate-pulse" : "text-slate-900 dark:text-white"}`}
                          >
                            रू{eligibility.effectiveRate}/$
                          </span>
                          {eligibility.effectiveRate !== rate && (
                            <span className="text-[8px] text-slate-500 dark:text-zinc-500 line-through">
                              रू{rate || 165}/$
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest text-xs">
                          Payable
                        </span>
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-3xl font-black transition-all ${eligibility.hasSeriousWarnings ? "text-rose-600 dark:text-rose-500" : eligibility.discountApplied ? "text-emerald-600 dark:text-emerald-500" : "text-indigo-600 dark:text-indigo-400"}`}
                          >
                            रू{eligibility.totalNpr.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ${eligibility.isEligible ? "text-emerald-500" : eligibility.hasSeriousWarnings ? "text-rose-500" : "text-amber-500"}`}
                        >
                          {eligibility.isEligible ? "Ready" : "Ineligible"}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                          Balance: रू{profile?.balance?.toLocaleString()}
                        </span>
                      </div>
                      {eligibility.warnings.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1">
                            Operational Logic Check
                          </p>
                          {eligibility.warnings.map((warning, idx) => (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={idx}
                              className={`p-3 rounded-xl flex items-start gap-2 text-xs border transition-all ${
                                warning.type === "error"
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                  : warning.type === "warning"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              }`}
                            >
                              <AlertCircle
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <span>{warning.message}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      placeholder="Instructions..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                {modalSubmitError && (
                  <div className="lg:col-span-2 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-sm rounded-xl border border-red-200 dark:border-red-500/20">
                    {modalSubmitError}
                  </div>
                )}
                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Load Money Modal */}
      <BalanceTopUpModal
        isOpen={isLoadMoneyModalOpen}
        onClose={() => setIsLoadMoneyModalOpen(false)}
        profile={profile as any}
        user={user}
        onSuccess={(msg) => setNotification(msg)}
      />

      <BoostRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile as any}
        user={user}
        rate={rate || 165}
        editingRequestId={editingRequestId}
        requests={requests}
        onSuccess={(msg) => setNotification(msg)}
      />

      <AdminSettings
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        rate={rate}
        whatsappNumber={whatsappNumber}
        pageRoleInfo={pageRoleInfo}
        allowedPlatforms={allowedPlatforms}
        adminAlertMessage={adminAlertMessage}
        invoiceConfig={invoiceConfig}
        onUpdateRate={handleAdminUpdateRate}
        onUpdateWhatsApp={handleAdminUpdateWhatsApp}
        onUpdatePageRole={handleAdminUpdatePageRole}
        onUpdateAllowedPlatforms={handleAdminUpdateAllowedPlatforms}
        onUpdateAlert={handleAdminUpdateAlert}
        onUpdateInvoiceConfig={handleAdminUpdateInvoiceConfig}
      />
      {/* Text Format Modal */}
      <AnimatePresence>
        {isTextFormatModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsTextFormatModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-zinc-900 p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-zinc-800 ring-1 dark:ring-white/5"
            >
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Campaign Text Format
                </h2>
                <button
                  onClick={() => setIsTextFormatModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-sm text-zinc-300 whitespace-pre-wrap select-all cursor-text mb-6 max-h-[400px] overflow-y-auto">
                {generateTextFormat()}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateTextFormat());
                  alert("Copied to clipboard!");
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
              >
                Copy to Clipboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Text Format Modal */}

      {/* Components will be rendered by their respective calls added previously */}
      {editingRemarksId && (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-lg">Update Remarks</h3>
            <textarea
              value={editRemarksValue}
              onChange={(e) => setEditRemarksValue(e.target.value)}
              className="w-full h-32 p-3 border dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm"
              placeholder="Enter remarks for the user..."
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await handleUpdateRemarks(
                      editingRemarksId,
                      editRemarksValue,
                    );
                    setNotification("Remarks updated successfully!");
                    setEditingRemarksId(null);
                  } catch (e) {
                    console.error("Error updating remarks:", e);
                  }
                }}
                className="flex-1 bg-emerald-600 text-white p-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                Save Remarks
              </button>
              <button
                onClick={() => setEditingRemarksId(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 p-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewRequestId && (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-lg">Boost Request Preview</h3>
            <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-lg text-sm whitespace-pre-line font-mono">
              {(() => {
                const req = requests.find((r) => r.id === previewRequestId);
                return req ? formatRequestText(req) : "Request not found";
              })()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const req = requests.find((r) => r.id === previewRequestId);
                  if (req) {
                    navigator.clipboard.writeText(formatRequestText(req));
                    alert("Copied campaign text!");
                  }
                }}
                className="flex-1 bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Copy Campaign Text
              </button>
              <button
                onClick={() => setPreviewRequestId(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 p-2 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-[1300] bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-2"
        >
          <CheckCircle2 size={20} />
          {notification}
        </motion.div>
      )}

      {/* WhatsApp Support Button */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[900]">
        <a
          href={`https://wa.me/${whatsappNumber?.replace(/[^0-9]/g, "") || "9779843398340"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center bg-[#25D366] hover:bg-[#1DA851] text-white p-1 md:p-2 rounded-r-lg md:rounded-r-2xl shadow-[2px_0_10px_rgba(0,0,0,0.15)] md:shadow-[4px_0_15px_rgba(0,0,0,0.2)] border-y border-r md:border-y-2 md:border-r-2 border-white/30 transition-all hover:pl-2 md:hover:pl-4 active:scale-90"
        >
          <div className="flex items-center gap-1 mb-0 md:mb-1">
            <MessageSquare className="w-3 h-3 md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
            <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white animate-pulse hidden xs:block" />
          </div>
          <span className="[writing-mode:vertical-lr] py-1 md:py-3 text-[8px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] select-none">
            Support
          </span>
        </a>
      </div>

      <InvoiceGenerator
        selectedInvoiceReq={selectedInvoiceReq}
        invoiceConfig={invoiceConfig}
      />
    </div>
  );
}
