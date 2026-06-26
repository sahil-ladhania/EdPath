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
    <div className="rounded-lg border border-border bg-paper px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Icon icon={BookOpenIcon} size="xs" className="mt-0.5 shrink-0" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-snug text-ink">
              {objective.title}
            </p>
            <p className="text-xs leading-snug text-ink-muted">
              {objective.description}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 rounded-sm px-2 py-0.5 text-xs capitalize text-primary"
        >
          {objective.difficulty}
        </Badge>
      </div>
    </div>
  );
}
