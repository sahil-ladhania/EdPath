"use client";

/**
 * Legacy planning skeleton — superseded by `GeneratingPanel`; kept for reference.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/Panel";

export function PlanningLoader() {
  return (
    <Panel>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-12 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-border bg-paper p-4"
          >
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
    </Panel>
  );
}
