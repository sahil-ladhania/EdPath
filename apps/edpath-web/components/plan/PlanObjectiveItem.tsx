"use client";

import { BookOpenIcon } from "lucide-react";
import type { Objective } from "@repo/types";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";

interface PlanObjectiveItemProps {
  objective: Objective;
}

export function PlanObjectiveItem({ objective }: PlanObjectiveItemProps) {
  return (
    <div className="rounded-lg border border-border bg-paper p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Icon icon={BookOpenIcon} size="sm" className="mt-0.5" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-ink">{objective.title}</p>
            <p className="text-sm text-ink-muted">{objective.description}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 rounded-sm px-2.5 py-1 capitalize text-primary"
        >
          {objective.difficulty}
        </Badge>
      </div>
    </div>
  );
}
