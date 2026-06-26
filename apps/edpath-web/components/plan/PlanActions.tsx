"use client";

import { CheckIcon, MessageCircleIcon, PencilLineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface PlanActionsProps {
  onApprove: () => void;
}

export function PlanActions({ onApprove }: PlanActionsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-ink">Ready for questions?</p>
        <p className="text-xs text-ink-muted">
          Approve this path to start with the first question.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button className="sm:min-w-44" onClick={onApprove}>
          <Icon icon={CheckIcon} size="sm" variant="inverse" />
          Approve lesson
        </Button>
        <Button variant="outline" disabled>
          <Icon icon={PencilLineIcon} size="sm" />
          Request changes
        </Button>
        <Button variant="ghost" disabled>
          <Icon icon={MessageCircleIcon} size="sm" />
          Chat to revise
        </Button>
      </div>
    </div>
  );
}
