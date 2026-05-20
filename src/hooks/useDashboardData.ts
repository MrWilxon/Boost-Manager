import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  QueryDocumentSnapshot,
  startAfter,
  endBefore,
  limitToLast
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { BoostRequest, BalanceRequest, UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

export const useDashboardData = (
  user: FirebaseUser | null, 
  profile: UserProfile | null,
  itemsPerPage: number
) => {
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [queryConstraints, setQueryConstraints] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile || !profile.role) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);

    const baseQuery = profile.role === "Admin"
      ? collection(db, "requests")
      : query(collection(db, "requests"), where("userId", "==", user.uid));

    const reqQuery = query(
      baseQuery,
      orderBy("createdAt", "desc"),
      ...queryConstraints,
      limit(itemsPerPage),
    );

    const balBaseQuery = profile?.role === "Admin"
      ? collection(db, "balanceRequests")
      : query(collection(db, "balanceRequests"), where("userId", "==", user.uid));

    const balQuery = query(balBaseQuery, orderBy("date", "desc"), limit(100));

    const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
      const docs = snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() } as BoostRequest));
      setRequests(docs);
      setFirstDoc(snapshot.docs[0] || null);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === itemsPerPage);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "requests");
    });

    const unsubscribeBalance = onSnapshot(balQuery, (snapshot) => {
      const docs = snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() } as BalanceRequest));
      setBalanceRequests(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "balanceRequests");
    });

    return () => {
      unsubscribeReqs();
      unsubscribeBalance();
    };
  }, [user?.uid, profile?.role, itemsPerPage, queryConstraints]);

  const paginate = (direction: "next" | "prev") => {
    if (direction === "next" && lastDoc) {
      setQueryConstraints([startAfter(lastDoc)]);
      setCurrentPage(prev => prev + 1);
    } else if (direction === "prev" && firstDoc) {
      setQueryConstraints([endBefore(firstDoc), limitToLast(itemsPerPage)]);
      setCurrentPage(prev => Math.max(1, prev - 1));
    } else if (direction === "prev" && currentPage === 1) {
      setQueryConstraints([]);
    }
  };

  return {
    requests,
    balanceRequests,
    loading,
    loadingMore,
    currentPage,
    hasMore,
    paginate,
    setRequests,
    setBalanceRequests
  };
};
