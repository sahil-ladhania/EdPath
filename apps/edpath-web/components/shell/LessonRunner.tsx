"use client";

import { DevPreviewControls } from "@/components/dev/DevPreviewControls";
import { useCopilotTransportError } from "@/components/copilot/copilot-transport-error-context";
import { McqWidget } from "@/components/mcq/McqWidget";
import { PlanWidget } from "@/components/plan/PlanWidget";
import { LessonErrorBanner } from "@/components/shell/LessonErrorBanner";
import { ObjectiveRail } from "@/components/shell/ObjectiveRail";
import { LessonShell } from "@/components/shell/LessonShell";
import { SummaryView } from "@/components/summary/SummaryView";
import { useCoAgentLesson } from "@/components/shell/useCoAgentLesson";
import { GeneratingPanel } from "@/components/ui/GeneratingPanel";
import { useCoAgentQuiz } from "@/hooks/useCoAgentQuiz";
import {
  getGeneratingPhaseMessage,
  getGeneratingPhaseSubtext,
  getLessonErrorTitle,
  getSummarizingMessage,
  getSummarizingSubtext,
  isGeneratingPhase,
  isLessonGenerationError,
  isSummarizingTransition,
  resolveLessonPhase,
} from "@/lib/phase-ui";
import { useEffect } from "react";

/** Dev-only: opt in with NEXT_PUBLIC_EDPATH_DEV_PREVIEW=true. Default OFF. */
const DEV_PREVIEW_ENABLED =
  process.env.NEXT_PUBLIC_EDPATH_DEV_PREVIEW === "true";

interface LessonRunnerProps {
  threadId: string;
}

export function LessonRunner({ threadId }: LessonRunnerProps) {
  const coAgentLesson = useCoAgentLesson(threadId);
  const { transportError, clearTransportError } = useCopilotTransportError();
  const coAgentQuiz = useCoAgentQuiz({
    state: coAgentLesson.state,
    plan: coAgentLesson.plan,
    submitAnswer: coAgentLesson.submitAnswer,
    submitHelp: coAgentLesson.submitHelp,
    canSubmitAnswer: coAgentLesson.canSubmitAnswer,
    canSubmitHelp: coAgentLesson.canSubmitHelp,
    isRunning: coAgentLesson.isRunning,
  });
  const phase = resolveLessonPhase(coAgentLesson.state);
  const plan = coAgentLesson.plan;
  const pdfTitle = coAgentLesson.pdfTitle;
  const generationError = isLessonGenerationError(coAgentLesson.state)
    ? coAgentLesson.state.lastError
    : null;
  const isGenerating = isGeneratingPhase(phase) && !generationError;
  const isSummarizing = isSummarizingTransition(coAgentLesson.state);
  const generatingMessage = isSummarizing
    ? getSummarizingMessage()
    : getGeneratingPhaseMessage(phase) ?? "Generating your roadmap…";
  const generatingSubtextBase = isSummarizing
    ? getSummarizingSubtext()
    : getGeneratingPhaseSubtext(phase);
  const generatingSubtext = coAgentLesson.isRunning
    ? `${generatingSubtextBase ?? "Please wait…"} Still working…`
    : generatingSubtextBase;
  const showQuiz =
    phase === "awaiting_input" &&
    coAgentQuiz.currentQuestion !== null &&
    transportError === null;

  useEffect(() => {
    if (coAgentLesson.state.feedback !== null) {
      clearTransportError();
    }
  }, [clearTransportError, coAgentLesson.state.feedback]);

  return (
    <>
      <LessonShell
        rail={
          <ObjectiveRail
            objectives={plan?.objectives ?? []}
            currentObjectiveIndex={coAgentLesson.state.currentObjectiveIndex}
            phase={phase}
            currentQuestionIndex={coAgentLesson.state.currentQuestionIndex}
            questionCount={coAgentLesson.state.questions.length}
            isGenerating={isGenerating}
            hasGenerationError={generationError !== null}
            generatingMessage={generatingMessage}
            generatingSubtext={generatingSubtext}
          />
        }
      >
        {transportError ? (
          <LessonErrorBanner
            lastError={{
              node: "generate_mcq",
              kind: "schema_drift",
              detail: transportError.detail,
            }}
            title={transportError.message}
          />
        ) : null}
        {generationError ? (
          <LessonErrorBanner
            lastError={generationError}
            title={getLessonErrorTitle(generationError)}
          />
        ) : null}
        {isGenerating ? (
          <GeneratingPanel
            message={generatingMessage}
            subtext={generatingSubtext}
          />
        ) : null}
        {!isGenerating && phase === "awaiting_approval" && plan ? (
          <PlanWidget
            pdfTitle={pdfTitle}
            plan={plan}
            phase={phase}
            onApprove={coAgentLesson.approvePlan}
          />
        ) : null}
        {showQuiz && coAgentQuiz.currentQuestion ? (
          <McqWidget
            objectiveTitle={coAgentQuiz.currentObjectiveTitle}
            questionNumber={coAgentQuiz.questionNumber}
            questionCount={coAgentQuiz.questionCount}
            currentAttempt={coAgentQuiz.currentAttempt}
            question={coAgentQuiz.currentQuestion}
            selectedIndex={coAgentQuiz.selectedIndex}
            triedOptionIndices={coAgentQuiz.triedOptionIndices}
            feedback={coAgentQuiz.feedback}
            isOptionLocked={coAgentQuiz.isOptionLocked}
            isSubmitting={coAgentQuiz.isSubmitting}
            isHelpSubmitting={coAgentQuiz.isHelpSubmitting}
            canSubmit={coAgentQuiz.canSubmit}
            isWaitingForAnswer={coAgentQuiz.isWaitingForAnswer}
            helpThread={coAgentLesson.state.helpThread}
            helpTurnsUsed={coAgentLesson.state.helpTurnsUsed}
            canSubmitHelp={coAgentLesson.canSubmitHelp}
            onSelect={coAgentQuiz.selectOption}
            onSubmit={coAgentQuiz.submitAnswer}
            onSubmitHelp={coAgentQuiz.submitHelp}
            onRetry={coAgentQuiz.retryQuestion}
            onAdvance={coAgentQuiz.advance}
          />
        ) : null}
        {phase === "complete" && coAgentLesson.state.summary ? (
          <SummaryView summary={coAgentLesson.state.summary} />
        ) : null}
        <div className="sr-only" aria-hidden="true">
          {coAgentLesson.interruptElement}
        </div>
      </LessonShell>

      {DEV_PREVIEW_ENABLED ? (
        <DevPreviewControls
          threadId={threadId}
          phase={phase}
          currentObjectiveIndex={coAgentLesson.state.currentObjectiveIndex}
        />
      ) : null}
    </>
  );
}
