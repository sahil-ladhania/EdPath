"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { FeedbackState, MCQ } from "@/types/lesson.types";

interface OptionListProps {
  question: MCQ;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: FeedbackState | null;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export function OptionList({
  question,
  selectedIndex,
  triedOptionIndices,
  feedback,
  disabled,
  onSelect,
}: OptionListProps) {
  return (
    <RadioGroup
      value={selectedIndex === null ? undefined : String(selectedIndex)}
      onValueChange={(value) => onSelect(Number(value))}
      className="space-y-3"
    >
      {question.options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect =
          feedback?.verdict === "correct" && feedback.highlightIndex === index;
        const isIncorrect =
          feedback?.verdict === "incorrect" && feedback.highlightIndex === index;
        const isPreviouslyTried =
          !feedback && triedOptionIndices.includes(index);
        const isOptionDisabled = disabled || isPreviouslyTried;

        return (
          <label
            key={`${question.questionId}-${index}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-paper p-4 transition-colors",
              isOptionDisabled && "cursor-default",
              isSelected && !feedback && "border-primary bg-primary-soft/50",
              isCorrect && "border-success bg-success-soft",
              isIncorrect && "border-error bg-error-soft",
              isPreviouslyTried &&
                "border-border bg-paper opacity-60",
              !isSelected &&
                !feedback &&
                !isPreviouslyTried &&
                "border-border hover:border-primary hover:bg-primary-soft/40",
            )}
          >
            <RadioGroupItem
              value={String(index)}
              disabled={isOptionDisabled}
              className={cn(
                isCorrect && "border-success bg-success text-white",
                isIncorrect && "border-error bg-error text-white",
              )}
            />
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="space-y-1">
                <p
                  className={cn(
                    "font-medium text-ink",
                    isPreviouslyTried && "text-ink-muted",
                  )}
                >
                  {option}
                </p>
                <p className="text-sm text-ink-muted">
                  {isPreviouslyTried ? "Already tried" : `Option ${index + 1}`}
                </p>
              </div>
              {isCorrect ? (
                <CheckCircle2Icon className="size-5 shrink-0 text-success" />
              ) : null}
              {isIncorrect ? (
                <XCircleIcon className="size-5 shrink-0 text-error" />
              ) : null}
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}
