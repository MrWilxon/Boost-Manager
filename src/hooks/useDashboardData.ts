import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { BoostRequest, BalanceRequest, UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

export const useDashboardData = (
  user: User | null, 
  profile: UserProfile | null,
  token: string | null,
  itemsPerPage: number,
  scope: 'personal' | 'all' = 'personal'
) => {
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }
    
    // Ensure role exists
    const currentRole = profile.role || 'User';
    
    try {
      setLoading(true);
      
      const authToken = token || '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Fetch Boost Requests and Balance Requests in parallel
      const [reqResponse, balResponse] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/boost-requests?page=${currentPage}&limit=${itemsPerPage}&scope=${scope}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: controller.signal
        }),
        fetch(`${apiUrl}/api/dashboard/balance-requests?scope=${scope}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);

      if (!reqResponse.ok) throw new Error('Failed to fetch boost requests');
      if (!balResponse.ok) throw new Error('Failed to fetch balance requests');
      
      const { data: reqData, count } = await reqResponse.json();
      const { data: balData } = await balResponse.json();
      
      const mappedRequests: BoostRequest[] = (reqData || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        username: item.username,
        platform: item.platform,
        platforms: item.platforms,
        url: item.url,
        budget: Number(item.budget),
        allocatedBudget: Number(item.allocated_budget),
        duration: item.duration,
        adGoal: item.ad_goal,
        destination: item.destination,
        location: item.location,
        gender: item.gender,
        age: item.age,
        status: item.status,
        amountNpr: Number(item.amount_npr),
        rateUsed: Number(item.rate_used),
        remarks: item.remarks,
        adminNote: item.admin_note,
        date: new Date(item.created_at).toLocaleDateString(),
        timestamp: item.created_at,
        createdAt: item.created_at,
      }));
      
      setRequests(mappedRequests);
      setTotalCount(count || 0);
      setHasMore((count || 0) > currentPage * itemsPerPage);
      
      const mappedBalanceRequests: BalanceRequest[] = (balData || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        username: item.username,
        amount: Number(item.amount),
        status: item.status,
        method: item.method,
        transactionId: item.transaction_id,
        date: new Date(item.created_at).toLocaleDateString(),
        timestamp: item.created_at,
      }));
      
      setBalanceRequests(mappedBalanceRequests);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !profile) return;
    
    // If role is missing, fallback to User to prevent infinite loading
    if (!profile.role) {
      console.warn('Profile role is missing, defaulting to User');
      profile.role = 'User'; 
    }
    
    fetchData();

    // Setup realtime subscription to auto refresh on any database changes
    const channel = supabase
      .channel(`db-dashboard-changes_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boost_requests' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balance_requests' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role, currentPage, itemsPerPage]);

  const paginate = (direction: "next" | "prev") => {
    if (direction === "next" && hasMore) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    requests,
    balanceRequests,
    loading,
    currentPage,
    hasMore,
    paginate,
    setRequests,
    setBalanceRequests,
    refresh: fetchData,
  };
};
