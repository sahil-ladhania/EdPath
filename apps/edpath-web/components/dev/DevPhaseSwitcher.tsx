"use client";

import { useState } from "react";

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

interface DemoSurfaceOption {
  phase: Phase;
  label: string;
}

const surfaceOptions: DemoSurfaceOption[] = [
  { phase: "planning", label: "Building plan" },
  { phase: "awaiting_approval", label: "Plan review" },
  { phase: "quizzing", label: "Preparing questions" },
  { phase: "awaiting_input", label: "Question" },
  { phase: "complete", label: "Summary" },
];

export function DevPhaseSwitcher({
  phase,
  objectiveCount,
  currentObjectiveIndex,
  onSetPhase,
  onJumpToObjective,
  onSimulateOutcome,
}: DevPhaseSwitcherProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen((current) => !current)}
      >
        Demo controls
      </Button>

      {isOpen ? (
        <div className="w-[320px] rounded-lg border border-border bg-surface p-4 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-primary">
              Demo controls
            </p>
            <p className="text-sm text-ink-muted">
              Preview each lesson surface during review.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Show surface</p>
              <div className="flex flex-wrap gap-2">
                {surfaceOptions.map((option) => (
                  <button
                    key={option.phase}
                    type="button"
                    onClick={() => onSetPhase(option.phase)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                      option.phase === phase
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-paper text-ink hover:border-primary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Show objective</p>
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
              <p className="text-sm font-semibold text-ink">Answer outcome</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onSimulateOutcome(false)}
                >
                  Try incorrect
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => onSimulateOutcome(true)}
                >
                  Try correct
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
