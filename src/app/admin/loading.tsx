import React from 'react';
import { ModernLoader } from '@/src/components/common/ModernLoader';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-surface text-main font-sans pt-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white/5 rounded-2xl w-full mb-10"></div>
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-amber-500/10 rounded-lg"></div>
            <div className="h-4 w-40 bg-white/5 rounded-lg"></div>
          </div>
          <div className="w-32 h-10 bg-white/5 rounded-xl"></div>
        </div>

        {/* System Config Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
             <div className="h-48 bg-white/5 rounded-2xl"></div>
             <div className="h-64 bg-white/5 rounded-2xl"></div>
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 bg-white/[0.02] border border-white/5 rounded-3xl w-full flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
               <ModernLoader label="LOADING ADMIN PORTAL..." type="admin" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
