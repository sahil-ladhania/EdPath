"use client";

import type { LessonPlan, Phase } from "@repo/types";

import { PlanActions } from "@/components/plan/PlanActions";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { PlanObjectiveItem } from "@/components/plan/PlanObjectiveItem";
import { Separator } from "@/components/ui/separator";

interface PlanWidgetProps {
  pdfTitle: string;
  plan: LessonPlan;
  phase: Phase;
  onApprove: () => void;
}

export function PlanWidget({
  pdfTitle,
  plan,
  phase,
  onApprove,
}: PlanWidgetProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <PlanHeader pdfTitle={pdfTitle} plan={plan} phase={phase} />
      <Separator />
      <div className="space-y-4">
        {plan.objectives.map((objective, index) => (
          <PlanObjectiveItem
            key={objective.objectiveId}
            index={index}
            objective={objective}
          />
        ))}
      </div>
      <PlanActions onApprove={onApprove} />
    </div>
  );
}
