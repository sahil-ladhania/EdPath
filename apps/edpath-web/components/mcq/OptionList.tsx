"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import type { Feedback, PublicMCQ } from "@repo/types";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { OptionListProps } from "@/types/mcq";

const OPTION_LETTERS = ["a", "b", "c", "d"] as const;

export function OptionList({
  question,
  selectedIndex,
  triedOptionIndices,
  feedback,
  disabled,
  onSelect,
}: OptionListProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-paper/80 p-1.5">
      <RadioGroup
        value={selectedIndex === null ? undefined : String(selectedIndex)}
        onValueChange={(value) => onSelect(Number(value))}
        className="space-y-1.5"
      >
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect =
            feedback?.verdict === "correct" && feedback.highlightIndex === index;
          const isIncorrect =
            (feedback?.verdict === "incorrect" ||
              feedback?.verdict === "exhausted") &&
            feedback.highlightIndex === index;
          const isPreviouslyTried =
            !feedback && triedOptionIndices.includes(index);
          const isOptionDisabled = disabled || isPreviouslyTried;
          const showSelectedHighlight =
            isSelected &&
            (!feedback || feedback.canRetry) &&
            !isCorrect &&
            !isIncorrect;

          return (
            <label
              key={`${question.questionId}-${index}`}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
                isOptionDisabled && "cursor-default",
                showSelectedHighlight &&
                  "bg-primary-soft/80 ring-1 ring-inset ring-primary/20",
                isCorrect && "bg-success-soft ring-1 ring-inset ring-success/30",
                isIncorrect && "bg-error-soft ring-1 ring-inset ring-error/30",
                isPreviouslyTried && "bg-paper opacity-50",
                !showSelectedHighlight &&
                  !isCorrect &&
                  !isIncorrect &&
                  !isPreviouslyTried &&
                  "bg-surface hover:bg-border/30",
              )}
            >
              <RadioGroupItem
                value={String(index)}
                disabled={isOptionDisabled}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  isCorrect && "bg-success text-white",
                  isIncorrect && "bg-error text-white",
                  showSelectedHighlight &&
                    "bg-primary text-primary-foreground",
                  isPreviouslyTried && "bg-border/50 text-ink-muted",
                  !showSelectedHighlight &&
                    !isCorrect &&
                    !isIncorrect &&
                    !isPreviouslyTried &&
                    "bg-border/40 text-ink-muted",
                )}
                aria-hidden
              >
                {OPTION_LETTERS[index]}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm leading-normal text-ink",
                    isPreviouslyTried && "text-ink-muted",
                  )}
                >
                  {option}
                  {isPreviouslyTried ? (
                    <span className="text-xs text-ink-muted"> · Already tried</span>
                  ) : null}
                </p>
                {isCorrect ? (
                  <CheckCircle2Icon className="size-3.5 shrink-0 text-success" />
                ) : null}
                {isIncorrect ? (
                  <XCircleIcon className="size-3.5 shrink-0 text-error" />
                ) : null}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
