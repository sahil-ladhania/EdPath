"use client";

import { CheckIcon, CircleDotIcon, CircleIcon, RouteIcon } from "lucide-react";
import type { Objective, Phase } from "@repo/types";

import { GeneratingState } from "@/components/ui/GeneratingState";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import type { ObjectiveRailProps } from "@/types/shell";

export function ObjectiveRail({
  objectives,
  currentObjectiveIndex,
  phase,
  currentQuestionIndex = 0,
  questionCount = 0,
  isGenerating = false,
  hasGenerationError = false,
  generatingMessage,
  generatingSubtext,
}: ObjectiveRailProps): React.JSX.Element {
  const isQuizMode =
    !hasGenerationError &&
    (phase === "quizzing" || phase === "awaiting_input");

  return (
    <Panel size="sm" className="sticky top-6">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-ink-muted">
          <Icon icon={RouteIcon} size="xs" />
          Learning path
        </p>
        <h2 className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-ink">
          {isQuizMode ? "Current progress" : "Plan order"}
        </h2>
        <p className="text-xs leading-snug text-ink-muted">
          {isGenerating
            ? "Your objectives will appear here once ready."
            : isQuizMode
              ? "One question at a time."
              : "Review the full path before questions begin."}
        </p>
      </div>

      {isGenerating && generatingMessage ? (
        <GeneratingState
          message={generatingMessage}
          subtext={generatingSubtext}
          className="py-6"
        />
      ) : (
        <ol className="space-y-2">
          {objectives.map((objective, index) => {
            const isCompleted =
              phase === "complete" || index < currentObjectiveIndex;
            const isCurrent =
              phase !== "complete" && index === currentObjectiveIndex;

            return (
              <li key={objective.objectiveId} className="flex gap-2.5">
                <div className="flex flex-col items-center pt-0.5">
                  {isCompleted ? (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                      <CheckIcon className="size-3 text-primary" strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <CircleDotIcon
                      className="size-5 shrink-0 text-primary"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <CircleIcon
                      className="size-5 shrink-0 text-border"
                      strokeWidth={1.5}
                    />
                  )}
                  {index < objectives.length - 1 ? (
                    <div className="mt-1.5 min-h-6 w-px flex-1 bg-border" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5 pb-1">
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      isCurrent ? "text-ink" : "text-ink-muted",
                      isCompleted && "text-ink",
                    )}
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
      )}
    </Panel>
  );
}
