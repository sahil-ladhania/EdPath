"use client";

/**
 * Plan card header — PDF title, review copy, and objective count.
 */

import type { LessonPlan, Phase } from "@repo/types";
import { FileTextIcon } from "lucide-react";

import { Icon } from "@/components/ui/Icon";

interface PlanHeaderProps {
  pdfTitle: string;
  plan: LessonPlan;
  phase: Phase;
}

export function PlanHeader({ pdfTitle, plan, phase }: PlanHeaderProps) {
  const isReviewing = phase === "awaiting_approval";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary">
        {isReviewing ? "Review your path" : "Lesson path"}
      </p>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-ink lg:text-3xl">
          Review your lesson path
        </h1>
        <p className="flex items-start gap-2 text-sm leading-snug text-ink-muted">
          <Icon icon={FileTextIcon} size="sm" className="mt-0.5 shrink-0" />
          <span>
            This is the full lesson path EdPath built from{" "}
            <span className="font-medium text-ink">{pdfTitle}</span>. Approve
            the complete roadmap to begin, or revise it first.
          </span>
        </p>
      </div>
      <p className="text-xs text-ink-muted">
        {plan.objectives.length} objectives · ordered from first step to final
        review
      </p>
    </div>
  );
}
