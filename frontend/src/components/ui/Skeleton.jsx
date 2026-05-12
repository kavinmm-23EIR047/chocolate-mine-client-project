import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-border/60 rounded-xl ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="bg-card border border-border/40 rounded-[1.5rem] overflow-hidden flex flex-col h-full bg-white dark:bg-[#1a1a1a] animate-pulse">
    {/* Image side */}
    <div className="relative aspect-[4/3] bg-border/40 m-2 rounded-t-[1.5rem]" />
    {/* Info side */}
    <div className="p-5 flex flex-col flex-1 space-y-4">
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <Skeleton className="h-5 w-1/3 rounded-md" />
      <div className="mt-auto space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="border-t border-dashed border-border/60 pt-4">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-10 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-80 rounded-2xl" />
    <Skeleton className="h-60 rounded-2xl" />
  </div>
);

export default Skeleton;
