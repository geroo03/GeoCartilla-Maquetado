import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-surface-container-high/70 ${className}`} />
);

/** Placeholder con la misma grilla que la tabla de pedidos. */
export const SkeletonRows: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => (
  <div className="divide-y divide-surface-container-high/40" aria-hidden="true">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 py-3.5 px-4">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <Skeleton
            key={colIndex}
            className={`h-3.5 ${colIndex === 0 ? 'w-24' : colIndex === 1 ? 'flex-1' : 'w-20'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high/60 flex gap-3"
      >
        <Skeleton className="w-16 h-22 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-20 mt-auto" />
        </div>
      </div>
    ))}
  </div>
);
