"use client";

import type { Summary } from "@repo/types";

interface OverallScoreProps {
  summary: Summary;
}

export function OverallScore({ summary }: OverallScoreProps) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-paper p-5 sm:grid-cols-3">
      <div className="space-y-1">
        <p className="text-sm text-ink-muted">Correct answers</p>
        <p className="font-mono text-4xl text-ink">
          {summary.overall.correct}/{summary.overall.total}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-ink-muted">First-try rate</p>
        <p className="font-mono text-4xl text-ink">
          {Math.round(summary.overall.firstTryRate * 100)}%
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-ink-muted">Lesson style</p>
        <p className="text-lg font-semibold text-ink">
          Guided practice with retries
        </p>
      </div>
    </div>
  );
}
