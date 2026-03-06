"use client";

import { Skeleton } from "@/components/ui/skeleton";

type DataTableSkeletonProps = {
  columns: number;
  rows: number;
};

export function DataTableSkeleton({ columns, rows }: DataTableSkeletonProps) {
  return (
    <div className="space-y-3 px-6 py-6">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          className="grid gap-3"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton className="h-12 rounded-xl" key={`${rowIndex}-${columnIndex}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
