"use client";

import type { Feedback, HelpThreadMessage, PublicMCQ } from "@repo/types";

import { MAX_ATTEMPTS, MAX_HELP } from "@/lib/mock-lesson";
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
  isHelpSubmitting?: boolean;
  canSubmit?: boolean;
  isWaitingForAnswer?: boolean;
  helpThread?: HelpThreadMessage[];
  helpTurnsUsed?: number;
  canSubmitHelp?: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onSubmitHelp?: (text: string) => void;
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
  isHelpSubmitting = false,
  canSubmit = true,
  isWaitingForAnswer = false,
  helpThread = [],
  helpTurnsUsed = 0,
  canSubmitHelp = false,
  onSelect,
  onSubmit,
  onSubmitHelp,
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
      <HelpInput
        thread={helpThread}
        helpTurnsUsed={helpTurnsUsed}
        maxHelp={MAX_HELP}
        canSubmitHelp={canSubmitHelp}
        isSubmitting={isHelpSubmitting}
        onSubmitHelp={onSubmitHelp ?? (() => undefined)}
      />
    </Panel>
  );
}
