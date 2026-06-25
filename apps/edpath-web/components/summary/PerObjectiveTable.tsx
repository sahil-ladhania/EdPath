"use client";

import type { Summary } from "@/types/lesson.types";

interface PerObjectiveTableProps {
  summary: Summary;
}

export function PerObjectiveTable({ summary }: PerObjectiveTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[minmax(0,1.8fr)_120px_140px] gap-3 bg-paper px-4 py-3 text-sm font-semibold text-ink-muted">
        <p>Objective</p>
        <p>Correct</p>
        <p>First try</p>
      </div>
      <div className="divide-y divide-border bg-surface">
        {summary.perObjective.map((objective) => (
          <div
            key={objective.objectiveId}
            className="grid grid-cols-[minmax(0,1.8fr)_120px_140px] gap-3 px-4 py-4 text-sm"
          >
            <p className="font-medium text-ink">{objective.title}</p>
            <p className="font-mono text-ink">
              {objective.correct}/{objective.total}
            </p>
            <p className="font-mono text-ink">{objective.firstTryRate}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
