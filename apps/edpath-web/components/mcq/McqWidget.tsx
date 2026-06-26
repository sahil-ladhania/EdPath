"use client";

import type { Feedback, PublicMCQ } from "@repo/types";

import { MAX_ATTEMPTS } from "@/lib/mock-lesson";
import { FeedbackBanner } from "@/components/mcq/FeedbackBanner";
import { HelpInput } from "@/components/mcq/HelpInput";
import { OptionList } from "@/components/mcq/OptionList";
import { QuestionHeader } from "@/components/mcq/QuestionHeader";
import { WidgetActions } from "@/components/mcq/WidgetActions";
import { Panel } from "@/components/ui/Panel";
import { Separator } from "@/components/ui/separator";

interface McqWidgetProps {
  objectiveTitle: string;
  questionNumber: number;
  questionCount: number;
  currentAttempt: number;
  question: PublicMCQ;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  isOptionLocked: boolean;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  isWaitingForAnswer?: boolean;
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
  triedOptionIndices,
  feedback,
  isOptionLocked,
  isSubmitting = false,
  canSubmit = true,
  isWaitingForAnswer = false,
  onSelect,
  onSubmit,
  onRetry,
  onAdvance,
}: McqWidgetProps) {
  return (
    <Panel>
      <QuestionHeader
        objectiveTitle={objectiveTitle}
        questionNumber={questionNumber}
        questionCount={questionCount}
        attemptNumber={currentAttempt}
        maxAttempts={MAX_ATTEMPTS}
      />
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-ink-muted">
          Choose one answer
        </p>
        <h3 className="text-xl font-semibold leading-ui text-ink">
          {question.question}
        </h3>
      </div>
      <OptionList
        question={question}
        selectedIndex={selectedIndex}
        triedOptionIndices={triedOptionIndices}
        feedback={feedback}
        disabled={isOptionLocked}
        onSelect={onSelect}
      />
      <FeedbackBanner feedback={feedback} />
      <WidgetActions
        hasSelection={selectedIndex !== null}
        feedback={feedback}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        isWaitingForAnswer={isWaitingForAnswer}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onAdvance={onAdvance}
      />
      <Separator />
      <HelpInput />
    </Panel>
  );
}
