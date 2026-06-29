"use client";

/**
 * Quiz card composition — question, options, feedback, help, and actions.
 */

// Constants
import { MAX_ATTEMPTS, MAX_HELP } from "@repo/schemas/constants";

// MCQ components
import { FeedbackBanner } from "@/components/mcq/FeedbackBanner";
import { HelpInput } from "@/components/mcq/HelpInput";
import { OptionList } from "@/components/mcq/OptionList";
import { QuestionHeader } from "@/components/mcq/QuestionHeader";
import { WidgetActions } from "@/components/mcq/WidgetActions";

// UI
import { Panel } from "@/components/ui/Panel";
import { Separator } from "@/components/ui/separator";

// Local types
import type { McqWidgetProps } from "@/types/mcq";

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
    <Panel size="sm" className="w-full max-w-2xl">
      <QuestionHeader
        objectiveTitle={objectiveTitle}
        questionNumber={questionNumber}
        questionCount={questionCount}
        attemptNumber={currentAttempt}
        maxAttempts={MAX_ATTEMPTS}
      />
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-ink-muted">
          Choose one answer
        </p>
        <h3 className="text-lg font-semibold leading-snug text-ink">
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
