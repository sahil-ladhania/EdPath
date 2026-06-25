"use client";

import { DevPhaseSwitcher } from "@/components/dev/DevPhaseSwitcher";
import { PlanningLoader } from "@/components/loaders/PlanningLoader";
import { QuizzingLoader } from "@/components/loaders/QuizzingLoader";
import { McqWidget } from "@/components/mcq/McqWidget";
import { PlanWidget } from "@/components/plan/PlanWidget";
import { ObjectiveRail } from "@/components/shell/ObjectiveRail";
import { LessonShell } from "@/components/shell/LessonShell";
import { SummaryReport } from "@/components/summary/SummaryReport";
import { useLesson } from "@/hooks/useLesson";

interface LessonRunnerProps {
  threadId: string;
}

export function LessonRunner({ threadId }: LessonRunnerProps) {
  const lesson = useLesson(threadId);

  return (
    <>
      <LessonShell
        rail={
          <ObjectiveRail
            objectives={lesson.plan.objectives}
            currentObjectiveIndex={lesson.currentObjectiveIndex}
            phase={lesson.phase}
          />
        }
      >
        {lesson.phase === "planning" ? <PlanningLoader /> : null}
        {lesson.phase === "awaiting_approval" ? (
          <PlanWidget
            pdfTitle={lesson.pdfTitle}
            plan={lesson.plan}
            onApprove={lesson.approvePlan}
            onSaveObjectives={lesson.updateObjectives}
          />
        ) : null}
        {lesson.phase === "quizzing" ? <QuizzingLoader /> : null}
        {lesson.phase === "awaiting_input" ? (
          <McqWidget
            objectiveTitle={lesson.currentObjective.title}
            questionNumber={lesson.currentQuestionIndex + 1}
            questionCount={lesson.currentQuestions.length}
            currentAttempt={lesson.currentAttempt}
            question={lesson.currentQuestion}
            selectedIndex={lesson.selectedIndex}
            feedback={lesson.feedback}
            isOptionLocked={lesson.isOptionLocked}
            onSelect={lesson.selectOption}
            onSubmit={lesson.submitAnswer}
            onRetry={lesson.retryQuestion}
            onAdvance={lesson.advance}
          />
        ) : null}
        {lesson.phase === "complete" ? (
          <SummaryReport summary={lesson.summary} />
        ) : null}
      </LessonShell>

      <DevPhaseSwitcher
        phase={lesson.phase}
        objectiveCount={lesson.plan.objectives.length}
        currentObjectiveIndex={lesson.currentObjectiveIndex}
        onSetPhase={lesson.setPhase}
        onJumpToObjective={lesson.jumpToObjective}
        onSimulateOutcome={lesson.simulateOutcome}
      />
    </>
  );
}
