"use client";

import { MAX_ATTEMPTS } from "@/lib/mock-lesson";
import { FeedbackBanner } from "@/components/mcq/FeedbackBanner";
import { HelpInput } from "@/components/mcq/HelpInput";
import { OptionList } from "@/components/mcq/OptionList";
import { QuestionHeader } from "@/components/mcq/QuestionHeader";
import { WidgetActions } from "@/components/mcq/WidgetActions";
import { Separator } from "@/components/ui/separator";
import type { FeedbackState, MCQ } from "@/types/lesson.types";

interface McqWidgetProps {
  objectiveTitle: string;
  questionNumber: number;
  questionCount: number;
  currentAttempt: number;
  question: MCQ;
  selectedIndex: number | null;
  feedback: FeedbackState | null;
  isOptionLocked: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onAdvance: () => void;
}

export function McqWidget({
  objectiveTitle,
  questionNumber,
  questionCount,
  currentAttempt,
  question,
  selectedIndex,
  feedback,
  isOptionLocked,
  onSelect,
  onSubmit,
  onRetry,
  onAdvance,
}: McqWidgetProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <QuestionHeader
        objectiveTitle={objectiveTitle}
        questionNumber={questionNumber}
        questionCount={questionCount}
        attemptNumber={currentAttempt}
        maxAttempts={MAX_ATTEMPTS}
      />
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-ink-muted">
          Multiple-choice check
        </p>
        <h3 className="text-xl font-semibold text-ink">{question.question}</h3>
      </div>
      <OptionList
        question={question}
        selectedIndex={selectedIndex}
        feedback={feedback}
        disabled={isOptionLocked}
        onSelect={onSelect}
      />
      <FeedbackBanner feedback={feedback} />
      <WidgetActions
        hasSelection={selectedIndex !== null}
        feedback={feedback}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onAdvance={onAdvance}
      />
      <Separator />
      <HelpInput />
    </div>
  );
}
