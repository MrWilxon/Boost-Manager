import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-surface text-muted font-sans" suppressHydrationWarning>
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24 pt-24 lg:pt-8" suppressHydrationWarning>
        
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="nm-flat rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-20 h-4 rounded-md animate-shimmer"></div>
                <div className="w-10 h-10 rounded-xl animate-shimmer"></div>
              </div>
              <div className="w-32 h-8 rounded-lg animate-shimmer mt-2"></div>
            </div>
          ))}
        </div>

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="h-16 rounded-2xl animate-shimmer"></div>
          <div className="h-16 rounded-2xl animate-shimmer"></div>
        </div>

        {/* Content Area Skeleton */}
        <div className="nm-flat rounded-3xl p-6 border border-white/5">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
            <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
            <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
          </div>
          
          {/* Table Header */}
          <div className="h-12 w-full rounded-xl animate-shimmer mb-4"></div>
          
          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl animate-shimmer mb-2 opacity-80"></div>
          ))}
        </div>
      </main>
    </div>
  );
};
