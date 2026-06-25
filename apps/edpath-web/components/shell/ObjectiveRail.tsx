"use client";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Objective, Phase } from "@/types/lesson.types";

interface ObjectiveRailProps {
  objectives: Objective[];
  currentObjectiveIndex: number;
  phase: Phase;
}

export function ObjectiveRail({
  objectives,
  currentObjectiveIndex,
  phase,
}: ObjectiveRailProps) {
  return (
    <div className="sticky top-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-5 space-y-1">
        <p className="text-xs font-semibold uppercase text-ink-muted">
          Objective rail
        </p>
        <h2 className="font-display text-2xl text-ink">Learning path</h2>
        <p className="text-sm text-ink-muted">
          One objective at a time, with the current step pinned in focus.
        </p>
      </div>

      <ol className="space-y-4">
        {objectives.map((objective, index) => {
          const isCompleted =
            phase === "complete" || index < currentObjectiveIndex;
          const isCurrent = phase !== "complete" && index === currentObjectiveIndex;

          return (
            <li key={objective.objectiveId} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-success bg-success text-white shadow-sm",
                    isCurrent &&
                      "border-primary bg-primary text-white shadow-sm shadow-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border bg-paper text-ink-muted",
                  )}
                >
                  {isCompleted ? <CheckIcon className="size-4" /> : index + 1}
                </div>
                {index < objectives.length - 1 ? (
                  <div className="mt-2 h-10 w-px bg-border" />
                ) : null}
              </div>

              <div className="min-w-0 space-y-1 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent ? "text-ink" : "text-ink-muted",
                    isCompleted && "text-ink",
                  )}
                >
                  {objective.title}
                </p>
                <p className="text-sm text-ink-muted">{objective.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
