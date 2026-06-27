"use client";

/**
 * PDF-grounded study tips list.
 */

import type { Summary } from "@repo/types";

interface StudyTipsListProps {
  summary: Summary;
}

export function StudyTipsList({ summary }: StudyTipsListProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-paper p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-primary">
          Study tips
        </p>
        <h3 className="font-display text-2xl text-ink">
          What to revisit next
        </h3>
      </div>
      <ul className="space-y-3">
        {summary.studyTips.map((tip) => (
          <li
            key={tip}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink"
          >
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
