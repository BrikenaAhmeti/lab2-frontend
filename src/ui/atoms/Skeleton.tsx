import { memo } from 'react';
import clsx from 'clsx';

interface SkeletonBlockProps {
  className?: string;
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={clsx('animate-pulse rounded-lg bg-surface', className)} aria-hidden="true" />;
}

export const Skeleton = memo(SkeletonBlock);

export const TableSkeleton = memo(function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border p-4" aria-hidden="true">
      <div className="animate-pulse space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-surface" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <div key={columnIndex} className="h-8 rounded bg-surface" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export const CardGridSkeleton = memo(function CardGridSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
  );
});

export default Skeleton;
