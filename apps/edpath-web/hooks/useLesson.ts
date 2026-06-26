"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildSummary,
  getMockLessonSnapshot,
  MAX_ATTEMPTS,
} from "@/lib/mock-lesson";
import type {
  FeedbackState,
  LessonPlan,
  MCQ,
  Objective,
  ObjectiveResult,
  Phase,
  QuestionAttemptState,
  Summary,
} from "@/types/lesson.types";

interface UseLessonOptions {
  initialPhase?: Phase;
}

interface UseLessonReturn {
  threadId: string;
  phase: Phase;
  plan: LessonPlan;
  pdfTitle: string;
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  currentObjective: Objective;
  currentQuestions: MCQ[];
  currentQuestion: MCQ;
  currentAttempt: number;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: FeedbackState | null;
  summary: Summary;
  isOptionLocked: boolean;
  setPhase: (phase: Phase) => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  retryQuestion: () => void;
  advance: () => void;
  approvePlan: () => void;
  updateObjectives: (objectives: Objective[]) => void;
  jumpToObjective: (index: number) => void;
  simulateOutcome: (correct: boolean) => void;
}

interface InternalState {
  phase: Phase;
  plan: LessonPlan;
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  attemptState: QuestionAttemptState;
  results: ObjectiveResult[];
}

const PLAN_DELAY_MS = 700;
const QUIZ_DELAY_MS = 700;

function createEmptyAttemptState(): QuestionAttemptState {
  return {
    selectedIndex: null,
    triedOptionIndices: [],
    attemptsForCurrentQuestion: 0,
    feedback: null,
  };
}

function addTriedOption(
  triedOptionIndices: number[],
  selectedIndex: number,
): number[] {
  return triedOptionIndices.includes(selectedIndex)
    ? triedOptionIndices
    : [...triedOptionIndices, selectedIndex];
}

export function useLesson(
  threadId: string,
  options?: UseLessonOptions,
): UseLessonReturn {
  const snapshot = useMemo(() => getMockLessonSnapshot(), []);
  const [state, setState] = useState<InternalState>({
    phase: options?.initialPhase ?? "awaiting_approval",
    plan: snapshot.plan,
    currentObjectiveIndex: 0,
    currentQuestionIndex: 0,
    attemptState: createEmptyAttemptState(),
    results: [],
  });

  const currentObjective = state.plan.objectives[state.currentObjectiveIndex];
  const currentQuestions = snapshot.objectiveQuestionMap[currentObjective.objectiveId];
  const currentQuestion = currentQuestions[state.currentQuestionIndex];

  const summary = useMemo(() => {
    return buildSummary(state.plan, state.results);
  }, [state.plan, state.results]);

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

  const setPhase = useCallback((phase: Phase): void => {
    setState((currentState) => ({
      ...currentState,
      phase,
      attemptState: createEmptyAttemptState(),
    }));
  }, []);

  const selectOption = useCallback((index: number): void => {
    setState((currentState) => ({
      ...currentState,
      attemptState: {
        ...currentState.attemptState,
        selectedIndex: index,
      },
    }));
  }, []);

  const submitAnswer = useCallback((): void => {
    setState((currentState) => {
      const objective = currentState.plan.objectives[currentState.currentObjectiveIndex];
      const question =
        snapshot.objectiveQuestionMap[objective.objectiveId][
          currentState.currentQuestionIndex
        ];

      if (currentState.attemptState.selectedIndex === null) {
        return currentState;
      }

      const attempts = currentState.attemptState.attemptsForCurrentQuestion + 1;
      const selectedIndex = currentState.attemptState.selectedIndex;
      const isCorrect = selectedIndex === question.correctIndex;
      const isExhausted = !isCorrect && attempts >= MAX_ATTEMPTS;
      const nextResults = [...currentState.results];

      if (isCorrect || isExhausted) {
        nextResults.push({
          objectiveId: objective.objectiveId,
          questionId: question.questionId,
          correct: isCorrect,
          attempts,
          firstTryCorrect: isCorrect && attempts === 1,
        });
      }

      const feedback: FeedbackState = isCorrect
        ? {
            verdict: "correct",
            highlightIndex: selectedIndex,
            detailKind: "explanation",
            detail: question.explanation,
            canRetry: false,
            canAdvance: true,
            isExhausted: false,
          }
        : {
            verdict: "incorrect",
            highlightIndex: selectedIndex,
            detailKind: isExhausted ? "explanation" : "hint",
            detail: isExhausted ? question.explanation : question.hint,
            canRetry: !isExhausted,
            canAdvance: isExhausted,
            isExhausted,
          };

      return {
        ...currentState,
        attemptState: {
          selectedIndex,
          triedOptionIndices: isCorrect
            ? currentState.attemptState.triedOptionIndices
            : addTriedOption(
                currentState.attemptState.triedOptionIndices,
                selectedIndex,
              ),
          attemptsForCurrentQuestion: attempts,
          feedback,
        },
        results: nextResults,
      };
    });
  }, [snapshot.objectiveQuestionMap]);

  const retryQuestion = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      attemptState: {
        ...currentState.attemptState,
        selectedIndex: null,
        feedback: null,
      },
    }));
  }, []);

  const advance = useCallback((): void => {
    setState((currentState) => {
      const objective = currentState.plan.objectives[currentState.currentObjectiveIndex];
      const questions = snapshot.objectiveQuestionMap[objective.objectiveId];
      const hasMoreQuestions =
        currentState.currentQuestionIndex < questions.length - 1;
      const hasMoreObjectives =
        currentState.currentObjectiveIndex < currentState.plan.objectives.length - 1;

      if (hasMoreQuestions) {
        return {
          ...currentState,
          currentQuestionIndex: currentState.currentQuestionIndex + 1,
          attemptState: createEmptyAttemptState(),
          phase: "awaiting_input",
        };
      }

      if (hasMoreObjectives) {
        return {
          ...currentState,
          currentObjectiveIndex: currentState.currentObjectiveIndex + 1,
          currentQuestionIndex: 0,
          attemptState: createEmptyAttemptState(),
          phase: "quizzing",
        };
      }

      return {
        ...currentState,
        attemptState: createEmptyAttemptState(),
        phase: "complete",
      };
    });
  }, [snapshot.objectiveQuestionMap]);

  const approvePlan = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      phase: "quizzing",
      attemptState: createEmptyAttemptState(),
    }));
  }, []);

  const updateObjectives = useCallback((objectives: Objective[]): void => {
    setState((currentState) => ({
      ...currentState,
      plan: {
        objectives,
      },
    }));
  }, []);

  const jumpToObjective = useCallback((index: number): void => {
    setState((currentState) => ({
      ...currentState,
      currentObjectiveIndex: index,
      currentQuestionIndex: 0,
      attemptState: createEmptyAttemptState(),
      phase: "awaiting_input",
    }));
  }, []);

  const simulateOutcome = useCallback(
    (correct: boolean): void => {
      const selectedIndex = correct
        ? currentQuestion.correctIndex
        : currentQuestion.options.findIndex(
            (_option, index) => index !== currentQuestion.correctIndex,
          );

      setState((currentState) => ({
        ...currentState,
        attemptState: {
          ...currentState.attemptState,
          selectedIndex,
        },
      }));

      window.setTimeout(() => {
        setState((currentState) => {
          if (currentState.attemptState.selectedIndex === null) {
            return currentState;
          }

          const objective =
            currentState.plan.objectives[currentState.currentObjectiveIndex];
          const question =
            snapshot.objectiveQuestionMap[objective.objectiveId][
              currentState.currentQuestionIndex
            ];
          const attempts = currentState.attemptState.attemptsForCurrentQuestion + 1;
          const selectedIndex = currentState.attemptState.selectedIndex;
          const isCorrect = selectedIndex === question.correctIndex;
          const isExhausted = !isCorrect && attempts >= MAX_ATTEMPTS;
          const nextResults = [...currentState.results];

          if (isCorrect || isExhausted) {
            nextResults.push({
              objectiveId: objective.objectiveId,
              questionId: question.questionId,
              correct: isCorrect,
              attempts,
              firstTryCorrect: isCorrect && attempts === 1,
            });
          }

          return {
            ...currentState,
            attemptState: {
              selectedIndex,
              triedOptionIndices: isCorrect
                ? currentState.attemptState.triedOptionIndices
                : addTriedOption(
                    currentState.attemptState.triedOptionIndices,
                    selectedIndex,
                  ),
              attemptsForCurrentQuestion: attempts,
              feedback: isCorrect
                ? {
                    verdict: "correct",
                    highlightIndex: selectedIndex,
                    detailKind: "explanation",
                    detail: question.explanation,
                    canRetry: false,
                    canAdvance: true,
                    isExhausted: false,
                  }
                : {
                    verdict: "incorrect",
                    highlightIndex: selectedIndex,
                    detailKind: isExhausted ? "explanation" : "hint",
                    detail: isExhausted ? question.explanation : question.hint,
                    canRetry: !isExhausted,
                    canAdvance: isExhausted,
                    isExhausted,
                  },
            },
            results: nextResults,
          };
        });
      }, 0);
    },
    [currentQuestion, snapshot.objectiveQuestionMap],
  );

  return {
    threadId,
    phase: state.phase,
    plan: state.plan,
    pdfTitle: snapshot.pdfMeta.filename,
    currentObjectiveIndex: state.currentObjectiveIndex,
    currentQuestionIndex: state.currentQuestionIndex,
    currentObjective,
    currentQuestions,
    currentQuestion,
    currentAttempt: state.attemptState.feedback
      ? state.attemptState.attemptsForCurrentQuestion
      : Math.min(state.attemptState.attemptsForCurrentQuestion + 1, MAX_ATTEMPTS),
    selectedIndex: state.attemptState.selectedIndex,
    triedOptionIndices: state.attemptState.triedOptionIndices,
    feedback: state.attemptState.feedback,
    summary,
    isOptionLocked: state.attemptState.feedback !== null,
    setPhase,
    selectOption,
    submitAnswer,
    retryQuestion,
    advance,
    approvePlan,
    updateObjectives,
    jumpToObjective,
    simulateOutcome,
  };
}
