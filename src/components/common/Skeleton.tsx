import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-md ${className}`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-[120px] overflow-hidden">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="border-b border-slate-50 dark:border-zinc-900/50">
    <td className="px-6 py-5"><Skeleton className="h-4 w-8" /></td>
    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
    <td className="px-6 py-5"><Skeleton className="h-4 w-32" /></td>
    <td className="px-6 py-5"><Skeleton className="h-4 w-12" /></td>
    <td className="px-6 py-5"><Skeleton className="h-4 w-16" /></td>
    <td className="px-6 py-5"><Skeleton className="h-7 w-20 rounded-lg" /></td>
    <td className="px-6 py-5"><Skeleton className="h-4 w-16" /></td>
  </tr>
);
