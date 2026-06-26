"use client";

import { CheckIcon } from "lucide-react";
import type { Objective, Phase } from "@repo/types";

import { cn } from "@/lib/utils";

interface ObjectiveRailProps {
  objectives: Objective[];
  currentObjectiveIndex: number;
  phase: Phase;
  currentQuestionIndex?: number;
  questionCount?: number;
}

export function ObjectiveRail({
  objectives,
  currentObjectiveIndex,
  phase,
  currentQuestionIndex = 0,
  questionCount = 0,
}: ObjectiveRailProps) {
  const isQuizMode = phase === "quizzing" || phase === "awaiting_input";

  return (
    <div className="sticky top-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-ink-muted">
          Learning path
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-ink">
          {isQuizMode ? "Current progress" : "Plan order"}
        </h2>
        <p className="text-sm text-ink-muted">
          {isQuizMode
            ? "One question at a time."
            : "Review the full path before questions begin."}
        </p>
      </div>

      <ol className="space-y-3">
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
                      "border-primary-soft bg-primary-soft text-primary",
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
                    "truncate text-sm font-semibold",
                    isCurrent ? "text-ink" : "text-ink-muted",
                    isCompleted && "text-ink",
                  )}
                  title={objective.title}
                >
                  {objective.title}
                </p>
                {isQuizMode && isCurrent ? (
                  <p className="text-xs font-medium text-primary">
                    Question {currentQuestionIndex + 1} of {questionCount}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
