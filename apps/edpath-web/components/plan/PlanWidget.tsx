"use client";

import { PlanActions } from "@/components/plan/PlanActions";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { PlanObjectiveItem } from "@/components/plan/PlanObjectiveItem";
import { Separator } from "@/components/ui/separator";
import type { LessonPlan, Objective } from "@/types/lesson.types";

interface PlanWidgetProps {
  pdfTitle: string;
  plan: LessonPlan;
  onApprove: () => void;
  onSaveObjectives: (objectives: Objective[]) => void;
}

export function PlanWidget({
  pdfTitle,
  plan,
  onApprove,
  onSaveObjectives,
}: PlanWidgetProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <PlanHeader pdfTitle={pdfTitle} plan={plan} />
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
      <PlanActions
        objectives={plan.objectives}
        onApprove={onApprove}
        onSaveObjectives={onSaveObjectives}
      />
    </div>
  );
}
