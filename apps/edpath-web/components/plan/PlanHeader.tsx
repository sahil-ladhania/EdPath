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
          Review the generated learning path before any quizzing starts. This
          mirrors the `awaiting_approval` checkpoint in the full system.
        </p>
      </div>
      <div className="text-sm text-ink-muted">
        {plan.objectives.length} objectives · ordered · one question stream at a
        time
      </div>
    </div>
  );
}
