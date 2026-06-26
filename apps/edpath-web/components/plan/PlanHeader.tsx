"use client";

import type { LessonPlan, Phase } from "@repo/types";

interface PlanHeaderProps {
  pdfTitle: string;
  plan: LessonPlan;
  phase: Phase;
}

export function PlanHeader({ pdfTitle, plan, phase }: PlanHeaderProps) {
  const isReviewing = phase === "awaiting_approval";

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary">
        {isReviewing ? "Review your path" : "Lesson path"}
      </p>
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-[var(--tracking-display)] text-ink">
          Review your lesson path
        </h1>
        <p className="max-w-2xl text-base text-ink-muted">
          This is the route EdPath will use for {pdfTitle}. Approve it to begin,
          or ask for changes first.
        </p>
      </div>
      <div className="text-sm text-ink-muted">
        {plan.objectives.length} objectives · ordered from first step to final
        review
      </div>
    </div>
  );
}
