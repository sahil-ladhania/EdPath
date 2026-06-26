"use client";

import { GraduationCapIcon } from "lucide-react";
import type { Summary } from "@repo/types";

import { OverallScore } from "@/components/summary/OverallScore";
import { PerObjectiveTable } from "@/components/summary/PerObjectiveTable";
import { RestartCta } from "@/components/summary/RestartCta";
import { StudyTipsList } from "@/components/summary/StudyTipsList";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";

interface SummaryViewProps {
  summary: Summary;
}

export function SummaryView({ summary }: SummaryViewProps) {
  return (
    <Panel>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary">
          <Icon icon={GraduationCapIcon} size="xs" variant="brand" />
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
    </Panel>
  );
}
