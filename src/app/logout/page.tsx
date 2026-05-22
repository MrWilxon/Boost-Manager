'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Logout() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      await signOut();
      router.replace('/login');
    };
    doLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <p className="text-muted">Signing out...</p>
    </div>
  );
}
