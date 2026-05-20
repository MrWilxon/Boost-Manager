import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { BoostRequest, BalanceRequest, UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

export const useDashboardData = (
  user: User | null, 
  profile: UserProfile | null,
  itemsPerPage: number
) => {
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    if (!user || !profile || !profile.role) return;
    
    try {
      setLoading(true);
      
      // 1. Fetch Boost Requests with pagination
      let reqQuery = supabase
        .from('boost_requests')
        .select('*', { count: 'exact' });
        
      if (profile.role !== 'Admin') {
        reqQuery = reqQuery.eq('user_id', user.id);
      }
      
      reqQuery = reqQuery
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
        
      const { data: reqData, count, error: reqError } = await reqQuery;
      
      if (reqError) throw reqError;
      
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

      // 2. Fetch Balance Requests
      let balQuery = supabase
        .from('balance_requests')
        .select('*');
        
      if (profile.role !== 'Admin') {
        balQuery = balQuery.eq('user_id', user.id);
      }
      
      balQuery = balQuery
        .order('created_at', { ascending: false })
        .limit(100);
        
      const { data: balData, error: balError } = await balQuery;
      if (balError) throw balError;
      
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
    if (!user || !profile || !profile.role) return;
    
    fetchData();

    // Setup realtime subscription to auto refresh on any database changes
    const channel = supabase
      .channel('db-dashboard-changes')
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
