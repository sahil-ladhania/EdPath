"use client";

import type { LessonPlan } from "@/types/lesson.types";

interface PlanHeaderProps {
  pdfTitle: string;
  plan: LessonPlan;
}

export function PlanHeader({ pdfTitle, plan }: PlanHeaderProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-primary">
        Your lesson plan
      </p>
      <div className="space-y-2">
        <h1 className="font-display text-4xl text-ink">{pdfTitle}</h1>
        <p className="max-w-2xl text-base text-ink-muted">
          Review the path before questions begin. You can approve it now or ask
          for changes first.
        </p>
      </div>
      <div className="text-sm text-ink-muted">
        {plan.objectives.length} objectives · ordered from first step to final
        review
      </div>
    </div>
  );
}
