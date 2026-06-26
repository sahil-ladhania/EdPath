"use client";

import type { LessonPlan, Phase } from "@repo/types";

import { PlanActions } from "@/components/plan/PlanActions";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { PlanObjectiveItem } from "@/components/plan/PlanObjectiveItem";
import { Panel } from "@/components/ui/Panel";
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
    <Panel>
      <PlanHeader pdfTitle={pdfTitle} plan={plan} phase={phase} />
      <Separator />
      <div className="space-y-3">
        {plan.objectives.map((objective) => (
          <PlanObjectiveItem
            key={objective.objectiveId}
            objective={objective}
          />
        ))}
      </div>
      <PlanActions onApprove={onApprove} />
    </Panel>
  );
}
