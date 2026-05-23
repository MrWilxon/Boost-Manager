import React from 'react';
import { ModernLoader } from '@/src/components/common/ModernLoader';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface text-main font-sans pt-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white/5 rounded-2xl w-full mb-10"></div>
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-white/5 rounded-lg"></div>
            <div className="h-4 w-40 bg-white/5 rounded-lg"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-12 bg-white/5 rounded-xl"></div>
            <div className="w-36 h-12 bg-white/5 rounded-xl"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 mt-4">
          <div className="h-10 w-24 bg-white/5 rounded-full"></div>
          <div className="h-10 w-24 bg-white/5 rounded-full"></div>
          <div className="h-10 w-24 bg-white/5 rounded-full"></div>
        </div>
        
        {/* Table/Content Skeleton */}
        <div className="h-96 bg-white/[0.02] border border-white/5 rounded-3xl w-full mt-4 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
           <ModernLoader label="LOADING DASHBOARD..." type="dashboard" />
        </div>
        
      </div>
    </div>
  );
}
