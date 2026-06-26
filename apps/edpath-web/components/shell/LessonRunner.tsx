"use client";

import { DevPhaseSwitcher } from "@/components/dev/DevPhaseSwitcher";
import { PlanningLoader } from "@/components/loaders/PlanningLoader";
import { QuizzingLoader } from "@/components/loaders/QuizzingLoader";
import { McqWidget } from "@/components/mcq/McqWidget";
import { PlanWidget } from "@/components/plan/PlanWidget";
import { ObjectiveRail } from "@/components/shell/ObjectiveRail";
import { LessonShell } from "@/components/shell/LessonShell";
import { SummaryView } from "@/components/summary/SummaryView";
import { useCoAgentLesson } from "@/components/shell/useCoAgentLesson";
import { useLesson } from "@/hooks/useLesson";

interface LessonRunnerProps {
  threadId: string;
}

export function LessonRunner({ threadId }: LessonRunnerProps) {
  const lesson = useLesson(threadId);
  const coAgentLesson = useCoAgentLesson(threadId);
  const plan = coAgentLesson.plan ?? lesson.plan;
  const phase = coAgentLesson.phase;
  const pdfTitle = coAgentLesson.pdfTitle;

  return (
    <>
      <LessonShell
        rail={
          <ObjectiveRail
            objectives={plan.objectives}
            currentObjectiveIndex={coAgentLesson.state.currentObjectiveIndex}
            phase={phase}
            currentQuestionIndex={coAgentLesson.state.currentQuestionIndex}
            questionCount={coAgentLesson.state.questions.length}
          />
        }
      >
        {phase === "planning" ? <PlanningLoader /> : null}
        {phase === "awaiting_approval" ? (
          <PlanWidget
            pdfTitle={pdfTitle}
            plan={plan}
            phase={phase}
            onApprove={coAgentLesson.approvePlan}
          />
        ) : null}
        {phase === "quizzing" ? <QuizzingLoader /> : null}
        {phase === "awaiting_input" ? (
          <McqWidget
            objectiveTitle={lesson.currentObjective.title}
            questionNumber={lesson.currentQuestionIndex + 1}
            questionCount={lesson.currentQuestions.length}
            currentAttempt={lesson.currentAttempt}
            question={lesson.currentQuestion}
            selectedIndex={lesson.selectedIndex}
            triedOptionIndices={lesson.triedOptionIndices}
            feedback={lesson.feedback}
            isOptionLocked={lesson.isOptionLocked}
            onSelect={lesson.selectOption}
            onSubmit={lesson.submitAnswer}
            onRetry={lesson.retryQuestion}
            onAdvance={lesson.advance}
          />
        ) : null}
        {phase === "complete" ? (
          <SummaryView summary={lesson.summary} />
        ) : null}
        {coAgentLesson.interruptElement ? (
          <div className="mt-6">{coAgentLesson.interruptElement}</div>
        ) : null}
      </LessonShell>

      <DevPhaseSwitcher
        phase={phase}
        objectiveCount={plan.objectives.length}
        currentObjectiveIndex={coAgentLesson.state.currentObjectiveIndex}
        onSetPhase={lesson.setPhase}
        onJumpToObjective={lesson.jumpToObjective}
        onSimulateOutcome={lesson.simulateOutcome}
      />
    </>
  );
}
