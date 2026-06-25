"use client";

import { Badge } from "@/components/ui/badge";
import type { Objective } from "@/types/lesson.types";

interface PlanObjectiveItemProps {
  index: number;
  objective: Objective;
}

export function PlanObjectiveItem({
  index,
  objective,
}: PlanObjectiveItemProps) {
  return (
    <div className="rounded-lg border border-border bg-paper p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {index + 1}
          </div>
          <div>
            <p className="font-semibold text-ink">{objective.title}</p>
            <p className="text-sm text-ink-muted">{objective.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {objective.difficulty}
        </Badge>
      </div>
    </div>
  );
}
