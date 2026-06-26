"use client";

import { useState } from "react";
import { CircleCheckIcon, MessageSquareTextIcon } from "lucide-react";

import { PlanReviseChat } from "@/components/plan/PlanReviseChat";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface PlanActionsProps {
  objectiveCount: number;
  onApprove: () => void;
}

export function PlanActions({
  objectiveCount,
  onApprove,
}: PlanActionsProps): React.JSX.Element {
  const [isReviseOpen, setIsReviseOpen] = useState<boolean>(false);
  const objectiveLabel =
    objectiveCount === 1 ? "1 objective" : `${objectiveCount} objectives`;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Approve this lesson path</p>
        <p className="text-xs leading-snug text-ink-muted">
          This approves the complete roadmap above ({objectiveLabel}), not a
          single topic. Quiz questions begin once you approve.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onApprove}>
          <Icon icon={CircleCheckIcon} size="sm" variant="inverse" />
          Approve lesson path
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={isReviseOpen}
          aria-controls="plan-revise-chat"
          className={cn(isReviseOpen && "border-primary bg-primary-soft text-primary")}
          onClick={() => setIsReviseOpen((open) => !open)}
        >
          <Icon icon={MessageSquareTextIcon} size="sm" variant="brand" />
          Revise path
        </Button>
      </div>
      {isReviseOpen ? (
        <div id="plan-revise-chat">
          <PlanReviseChat onClose={() => setIsReviseOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
