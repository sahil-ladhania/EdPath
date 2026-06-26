"use client";

import type { Summary } from "@repo/types";

import { OverallScore } from "@/components/summary/OverallScore";
import { PerObjectiveTable } from "@/components/summary/PerObjectiveTable";
import { RestartCta } from "@/components/summary/RestartCta";
import { StudyTipsList } from "@/components/summary/StudyTipsList";

interface SummaryViewProps {
  summary: Summary;
}

export function SummaryView({ summary }: SummaryViewProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary">
          Lesson complete
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-[var(--tracking-display)] text-ink">
          You finished the guided path.
        </h1>
        <p className="max-w-2xl text-base text-ink-muted">
          Review your results by objective, then use the study tips to decide
          what to revisit next.
        </p>
      </div>
      <OverallScore summary={summary} />
      <PerObjectiveTable summary={summary} />
      <StudyTipsList summary={summary} />
      <RestartCta />
    </div>
  );
}
