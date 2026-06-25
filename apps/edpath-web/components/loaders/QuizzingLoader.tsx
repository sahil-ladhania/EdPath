"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function QuizzingLoader() {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-1/3 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-9 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}
