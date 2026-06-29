"use client";

/**
 * Plan approval surface — objectives list, approve/revise actions, and replan overlay.
 */

// Plan components
import { PlanActions } from "@/components/plan/PlanActions";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { PlanObjectiveItem } from "@/components/plan/PlanObjectiveItem";

// UI
import { GeneratingState } from "@/components/ui/GeneratingState";
import { Panel } from "@/components/ui/Panel";
import { Separator } from "@/components/ui/separator";

// Local types
import type { PlanWidgetProps } from "@/types/plan";

export function PlanWidget({
  pdfTitle,
  plan,
  phase,
  onApprove,
  canSubmitRevision,
  isReviseSubmitting,
  onSubmitRevision,
}: PlanWidgetProps) {
  return (
    <Panel>
      <PlanHeader pdfTitle={pdfTitle} plan={plan} phase={phase} />
      <Separator />
      <div className="relative">
        {isReviseSubmitting ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/85 backdrop-blur-sm"
            aria-live="polite"
            aria-busy="true"
          >
            <GeneratingState
              message="Revising your lesson path…"
              subtext="Updating objectives from your feedback."
              className="py-6"
            />
          </div>
        ) : null}
        <div className="space-y-3">
          {plan.objectives.map((objective) => (
            <PlanObjectiveItem
              key={objective.objectiveId}
              objective={objective}
            />
          ))}
        </div>
      </div>
      <PlanActions
        objectiveCount={plan.objectives.length}
        onApprove={onApprove}
        canSubmitRevision={canSubmitRevision}
        isReviseSubmitting={isReviseSubmitting}
        onSubmitRevision={onSubmitRevision}
      />
    </Panel>
  );
}
