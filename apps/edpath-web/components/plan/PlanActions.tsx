"use client";

import { Button } from "@/components/ui/button";

interface PlanActionsProps {
  onApprove: () => void;
}

export function PlanActions({ onApprove }: PlanActionsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
      <Button size="lg" className="sm:min-w-48" onClick={onApprove}>
        Approve lesson
      </Button>
      <Button size="lg" variant="outline" disabled>
        Request changes
      </Button>
      <Button size="lg" variant="secondary" disabled>
        Chat to revise
      </Button>
    </div>
  );
}
