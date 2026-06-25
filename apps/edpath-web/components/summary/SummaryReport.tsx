"use client";

import { OverallScore } from "@/components/summary/OverallScore";
import { PerObjectiveTable } from "@/components/summary/PerObjectiveTable";
import { RestartCta } from "@/components/summary/RestartCta";
import { StudyTipsList } from "@/components/summary/StudyTipsList";
import type { Summary } from "@/types/lesson.types";

interface SummaryReportProps {
  summary: Summary;
}

export function SummaryReport({ summary }: SummaryReportProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">
          Lesson complete
        </p>
        <h1 className="font-display text-4xl text-ink">
          You finished the full guided path.
        </h1>
        <p className="max-w-2xl text-base text-ink-muted">
          The final report stays tight: per-objective performance, overall
          progress, and the next study moves to make.
        </p>
      </div>
      <OverallScore summary={summary} />
      <PerObjectiveTable summary={summary} />
      <StudyTipsList summary={summary} />
      <RestartCta />
    </div>
  );
}
