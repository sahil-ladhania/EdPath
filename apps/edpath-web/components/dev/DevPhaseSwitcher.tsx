"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Phase } from "@/types/lesson.types";

interface DevPhaseSwitcherProps {
  phase: Phase;
  objectiveCount: number;
  currentObjectiveIndex: number;
  onSetPhase: (phase: Phase) => void;
  onJumpToObjective: (index: number) => void;
  onSimulateOutcome: (correct: boolean) => void;
}

const phaseOptions: Phase[] = [
  "planning",
  "awaiting_approval",
  "quizzing",
  "awaiting_input",
  "complete",
];

export function DevPhaseSwitcher({
  phase,
  objectiveCount,
  currentObjectiveIndex,
  onSetPhase,
  onJumpToObjective,
  onSimulateOutcome,
}: DevPhaseSwitcherProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[320px] rounded-lg border border-border bg-surface p-4 shadow-lg">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-primary">Dev tools</p>
        <p className="text-sm text-ink-muted">
          Drive every surface without backend or CopilotKit wiring.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Phase</p>
          <div className="flex flex-wrap gap-2">
            {phaseOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSetPhase(option)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  option === phase
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-paper text-ink hover:border-primary",
                )}
              >
                {option.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Jump objective</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: objectiveCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onJumpToObjective(index)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  index === currentObjectiveIndex
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-paper text-ink",
                )}
              >
                Objective {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Simulate answer</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onSimulateOutcome(false)}
            >
              Mark incorrect
            </Button>
            <Button type="button" className="flex-1" onClick={() => onSimulateOutcome(true)}>
              Mark correct
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
