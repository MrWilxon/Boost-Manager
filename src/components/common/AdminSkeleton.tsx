import React from 'react';

export const AdminSkeleton = () => {
  return (
    <div className="min-h-screen bg-surface text-muted font-sans" suppressHydrationWarning>
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24 pt-24 lg:pt-8" suppressHydrationWarning>
        
        {/* Header Skeleton */}
        <div className="nm-flat rounded-3xl p-6 md:p-8 mb-8 border border-white/5 flex gap-5 items-center">
          <div className="w-16 h-16 rounded-2xl animate-shimmer"></div>
          <div className="flex flex-col gap-2">
            <div className="w-48 h-8 rounded-lg animate-shimmer"></div>
            <div className="w-64 h-4 rounded-md animate-shimmer"></div>
          </div>
        </div>

        {/* Tab Pills Skeleton */}
        <div className="flex gap-4 mb-8">
          <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
          <div className="w-32 h-10 rounded-xl animate-shimmer"></div>
          <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
          <div className="w-24 h-10 rounded-xl animate-shimmer"></div>
          <div className="w-32 h-10 rounded-xl animate-shimmer"></div>
        </div>

        {/* Content Area Skeleton */}
        <div className="nm-flat rounded-3xl p-6 border border-white/5">
          {/* Internal Title or Controls */}
          <div className="flex justify-between mb-8">
            <div className="w-32 h-6 rounded-lg animate-shimmer"></div>
            <div className="w-24 h-8 rounded-lg animate-shimmer"></div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl animate-shimmer mb-3 opacity-80"></div>
          ))}
        </div>
      </main>
    </div>
  );
};
