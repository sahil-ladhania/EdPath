"use client";

/**
 * Legacy quizzing skeleton — superseded by `GeneratingPanel`; kept for reference.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/Panel";

export function QuizzingLoader() {
  return (
    <Panel>
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
    </Panel>
  );
}
