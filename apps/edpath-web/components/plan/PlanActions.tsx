"use client";

import { Button } from "@/components/ui/button";

interface PlanActionsProps {
  onApprove: () => void;
}

export function PlanActions({ onApprove }: PlanActionsProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Ready for questions?</p>
        <p className="text-sm text-ink-muted">
          Approve this path to start with the first question.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" className="sm:min-w-52" onClick={onApprove}>
          Approve lesson
        </Button>
        <Button size="lg" variant="outline" disabled>
          Request changes
        </Button>
        <Button size="lg" variant="ghost" disabled>
          Chat to revise
        </Button>
      </div>
    </div>
  );
}
