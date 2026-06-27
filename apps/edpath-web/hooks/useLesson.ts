"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CoAgentState,
  Feedback,
  LessonPlan,
  Objective,
  ObjectiveResult,
  Phase,
  PublicMCQ,
  Summary,
} from "@repo/types";

import {
  buildSummary,
  getMockCoAgentState,
  getQuestionsForObjective,
  MAX_ATTEMPTS,
} from "@/lib/mock-lesson";

interface UseLessonReturn {
  threadId: string;
  state: CoAgentState;
  phase: Phase;
  plan: LessonPlan;
  pdfTitle: string;
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  currentObjective: Objective;
  currentQuestions: PublicMCQ[];
  currentQuestion: PublicMCQ;
  currentAttempt: number;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  summary: Summary;
  isOptionLocked: boolean;
  setPhase: (phase: Phase) => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  retryQuestion: () => void;
  advance: () => void;
  approvePlan: () => void;
  jumpToObjective: (index: number) => void;
  simulateOutcome: (outcome: QuizPreviewOutcome) => void;
}

interface QuizMemory {
  triedOptionIndices: number[];
}

export type QuizPreviewOutcome = "correct" | "incorrect" | "exhausted";

const PLAN_DELAY_MS = 700;
const QUIZ_DELAY_MS = 700;

function getPlan(state: CoAgentState): LessonPlan {
  if (!state.plan) {
    throw new Error("Lesson plan is required for this lesson surface.");
  }

  return state.plan;
}

function getItemAt<TItem>(
  items: TItem[],
  index: number,
  label: string,
): TItem {
  const item = items[index];

  if (!item) {
    throw new Error(`${label} is missing from this lesson surface.`);
  }

  return item;
}

function addTriedOption(
  triedOptionIndices: number[],
  selectedIndex: number,
): number[] {
  return triedOptionIndices.includes(selectedIndex)
    ? triedOptionIndices
    : [...triedOptionIndices, selectedIndex];
}

function createCorrectFeedback(selectedIndex: number): Feedback {
  return {
    verdict: "correct",
    highlightIndex: selectedIndex,
    explanation:
      "Good work. The source supports this idea, so you can move to the next question.",
    canRetry: false,
  };
}

function createIncorrectFeedback(selectedIndex: number): Feedback {
  return {
    verdict: "incorrect",
    highlightIndex: selectedIndex,
    hint:
      "Think about the role named in the question, then compare each option against that idea.",
    canRetry: true,
  };
}

function createExhaustedFeedback(selectedIndex: number): Feedback {
  return {
    verdict: "exhausted",
    highlightIndex: selectedIndex,
    explanation:
      "This concept is about matching the structure to its role. Review the source note, then continue to keep the lesson moving.",
    canRetry: false,
  };
}

function createResult(
  objective: Objective,
  question: PublicMCQ,
  isCorrectOutcome: boolean,
  attempts: number,
): ObjectiveResult {
  return {
    objectiveId: objective.objectiveId,
    questionId: question.questionId,
    correct: isCorrectOutcome,
    attempts,
    firstTryCorrect: isCorrectOutcome && attempts === 1,
  };
}

function refreshSummary(state: CoAgentState): CoAgentState {
  const plan = getPlan(state);
  const summary = buildSummary(plan, state.results);

  return {
    ...state,
    score: {
      correct: summary.overall.correct,
      total: summary.overall.total,
      firstTry: state.results.filter((result) => result.firstTryCorrect).length,
    },
    summary,
  };
}

export function useLesson(threadId: string): UseLessonReturn {
  const initialState = useMemo(() => getMockCoAgentState(), []);
  const [state, setState] = useState<CoAgentState>(initialState);
  const [quizMemory, setQuizMemory] = useState<QuizMemory>({
    triedOptionIndices: [],
  });

  const plan = getPlan(state);
  const currentObjective = getItemAt(
    plan.objectives,
    state.currentObjectiveIndex,
    "Current objective",
  );
  const currentQuestions = getQuestionsForObjective(
    state,
    currentObjective.objectiveId,
  );
  const currentQuestion = getItemAt(
    currentQuestions,
    state.currentQuestionIndex,
    "Current question",
  );
  const summary = state.summary ?? buildSummary(plan, state.results);

  useEffect(() => {
    if (state.phase !== "planning" && state.phase !== "quizzing") {
      return;
    }

    const delay = state.phase === "planning" ? PLAN_DELAY_MS : QUIZ_DELAY_MS;
    const timeout = window.setTimeout(() => {
      setState((currentState) => ({
        ...currentState,
        phase:
          currentState.phase === "planning"
            ? "awaiting_approval"
            : "awaiting_input",
      }));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [state.phase]);

  const resetQuestionMemory = useCallback((): void => {
    setQuizMemory({ triedOptionIndices: [] });
  }, []);

  const setPhase = useCallback(
    (phase: Phase): void => {
      setState((currentState) => ({
        ...currentState,
        phase,
        selectedIndex: null,
        attempts: 0,
        feedback: null,
      }));
      resetQuestionMemory();
    },
    [resetQuestionMemory],
  );

  const selectOption = useCallback((index: number): void => {
    setState((currentState) => {
      if (currentState.feedback) {
        return currentState;
      }

      return {
        ...currentState,
        selectedIndex: index,
      };
    });
  }, []);

  const applyOutcome = useCallback(
    (outcome: QuizPreviewOutcome): void => {
      setState((currentState) => {
        const selectedIndex = currentState.selectedIndex;

        if (selectedIndex === null) {
          return currentState;
        }

        const currentPlan = getPlan(currentState);
        const objective = getItemAt(
          currentPlan.objectives,
          currentState.currentObjectiveIndex,
          "Current objective",
        );
        const questions = getQuestionsForObjective(
          currentState,
          objective.objectiveId,
        );
        const question = getItemAt(
          questions,
          currentState.currentQuestionIndex,
          "Current question",
        );
        const isCorrectOutcome = outcome === "correct";
        const isExhausted = outcome === "exhausted";
        const attempts = isExhausted
          ? MAX_ATTEMPTS
          : currentState.attempts + 1;
        const feedback = isCorrectOutcome
          ? createCorrectFeedback(selectedIndex)
          : isExhausted
            ? createExhaustedFeedback(selectedIndex)
            : createIncorrectFeedback(selectedIndex);
        const shouldRecordResult = isCorrectOutcome || isExhausted;
        const nextResults = shouldRecordResult
          ? [
              ...currentState.results,
              createResult(objective, question, isCorrectOutcome, attempts),
            ]
          : currentState.results;

        if (!isCorrectOutcome) {
          setQuizMemory((currentMemory) => ({
            triedOptionIndices: addTriedOption(
              currentMemory.triedOptionIndices,
              selectedIndex,
            ),
          }));
        }

        return refreshSummary({
          ...currentState,
          selectedIndex,
          attempts,
          feedback,
          results: nextResults,
        });
      });
    },
    [],
  );

  const submitAnswer = useCallback((): void => {
    applyOutcome("incorrect");
  }, [applyOutcome]);

  const retryQuestion = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      selectedIndex: null,
      feedback: null,
    }));
  }, []);

  const advance = useCallback((): void => {
    setState((currentState) => {
      const currentPlan = getPlan(currentState);
      const objective = getItemAt(
        currentPlan.objectives,
        currentState.currentObjectiveIndex,
        "Current objective",
      );
      const questions = getQuestionsForObjective(
        currentState,
        objective.objectiveId,
      );
      const hasMoreQuestions =
        currentState.currentQuestionIndex < questions.length - 1;
      const hasMoreObjectives =
        currentState.currentObjectiveIndex < currentPlan.objectives.length - 1;

      resetQuestionMemory();

      if (hasMoreQuestions) {
        return {
          ...currentState,
          currentQuestionIndex: currentState.currentQuestionIndex + 1,
          selectedIndex: null,
          attempts: 0,
          feedback: null,
          phase: "awaiting_input",
        };
      }

      if (hasMoreObjectives) {
        return {
          ...currentState,
          currentObjectiveIndex: currentState.currentObjectiveIndex + 1,
          currentQuestionIndex: 0,
          selectedIndex: null,
          attempts: 0,
          feedback: null,
          phase: "quizzing",
        };
      }

      return refreshSummary({
        ...currentState,
        selectedIndex: null,
        attempts: 0,
        feedback: null,
        phase: "complete",
      });
    });
  }, [resetQuestionMemory]);

  const approvePlan = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      phase: "quizzing",
      selectedIndex: null,
      attempts: 0,
      feedback: null,
    }));
    resetQuestionMemory();
  }, [resetQuestionMemory]);

  const jumpToObjective = useCallback(
    (index: number): void => {
      setState((currentState) => ({
        ...currentState,
        currentObjectiveIndex: index,
        currentQuestionIndex: 0,
        selectedIndex: null,
        attempts: 0,
        feedback: null,
        phase: "awaiting_input",
      }));
      resetQuestionMemory();
    },
    [resetQuestionMemory],
  );

  const simulateOutcome = useCallback(
    (outcome: QuizPreviewOutcome): void => {
      setState((currentState) => {
        if (currentState.selectedIndex !== null) {
          return currentState;
        }

        const firstAvailableIndex = currentQuestion.options.findIndex(
          (_option, index) => !quizMemory.triedOptionIndices.includes(index),
        );

        return {
          ...currentState,
          selectedIndex: firstAvailableIndex >= 0 ? firstAvailableIndex : 0,
        };
      });

      window.setTimeout(() => applyOutcome(outcome), 0);
    },
    [applyOutcome, currentQuestion.options, quizMemory.triedOptionIndices],
  );

  return {
    threadId,
    state,
    phase: state.phase,
    plan,
    pdfTitle: state.pdfMeta.filename,
    currentObjectiveIndex: state.currentObjectiveIndex,
    currentQuestionIndex: state.currentQuestionIndex,
    currentObjective,
    currentQuestions,
    currentQuestion,
    currentAttempt: state.feedback
      ? state.attempts
      : Math.min(state.attempts + 1, MAX_ATTEMPTS),
    selectedIndex: state.selectedIndex,
    triedOptionIndices: quizMemory.triedOptionIndices,
    feedback: state.feedback,
    summary,
    isOptionLocked: state.feedback !== null,
    setPhase,
    selectOption,
    submitAnswer,
    retryQuestion,
    advance,
    approvePlan,
    jumpToObjective,
    simulateOutcome,
  };
}
