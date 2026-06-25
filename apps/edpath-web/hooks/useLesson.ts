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
  selectedIndex: number | null;
  attemptsForCurrentQuestion: number;
  feedback: FeedbackState | null;
  results: ObjectiveResult[];
}

const PLAN_DELAY_MS = 700;
const QUIZ_DELAY_MS = 700;

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
    selectedIndex: null,
    attemptsForCurrentQuestion: 0,
    feedback: null,
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
      selectedIndex: null,
      feedback: null,
    }));
  }, []);

  const selectOption = useCallback((index: number): void => {
    setState((currentState) => ({
      ...currentState,
      selectedIndex: index,
    }));
  }, []);

  const submitAnswer = useCallback((): void => {
    setState((currentState) => {
      const objective = currentState.plan.objectives[currentState.currentObjectiveIndex];
      const question =
        snapshot.objectiveQuestionMap[objective.objectiveId][
          currentState.currentQuestionIndex
        ];

      if (currentState.selectedIndex === null) {
        return currentState;
      }

      const attempts = currentState.attemptsForCurrentQuestion + 1;
      const isCorrect = currentState.selectedIndex === question.correctIndex;
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
            highlightIndex: currentState.selectedIndex,
            detailKind: "explanation",
            detail: question.explanation,
            canRetry: false,
            canAdvance: true,
            isExhausted: false,
          }
        : {
            verdict: "incorrect",
            highlightIndex: currentState.selectedIndex,
            detailKind: isExhausted ? "explanation" : "hint",
            detail: isExhausted ? question.explanation : question.hint,
            canRetry: !isExhausted,
            canAdvance: isExhausted,
            isExhausted,
          };

      return {
        ...currentState,
        attemptsForCurrentQuestion: attempts,
        feedback,
        results: nextResults,
      };
    });
  }, [snapshot.objectiveQuestionMap]);

  const retryQuestion = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      selectedIndex: null,
      feedback: null,
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
          selectedIndex: null,
          attemptsForCurrentQuestion: 0,
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
          attemptsForCurrentQuestion: 0,
          feedback: null,
          phase: "quizzing",
        };
      }

      return {
        ...currentState,
        selectedIndex: null,
        feedback: null,
        phase: "complete",
      };
    });
  }, [snapshot.objectiveQuestionMap]);

  const approvePlan = useCallback((): void => {
    setState((currentState) => ({
      ...currentState,
      phase: "quizzing",
      selectedIndex: null,
      feedback: null,
      attemptsForCurrentQuestion: 0,
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
      selectedIndex: null,
      attemptsForCurrentQuestion: 0,
      feedback: null,
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
        selectedIndex,
      }));

      window.setTimeout(() => {
        setState((currentState) => {
          if (currentState.selectedIndex === null) {
            return currentState;
          }

          const objective =
            currentState.plan.objectives[currentState.currentObjectiveIndex];
          const question =
            snapshot.objectiveQuestionMap[objective.objectiveId][
              currentState.currentQuestionIndex
            ];
          const attempts = currentState.attemptsForCurrentQuestion + 1;
          const isCorrect = currentState.selectedIndex === question.correctIndex;
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
            attemptsForCurrentQuestion: attempts,
            feedback: isCorrect
              ? {
                  verdict: "correct",
                  highlightIndex: currentState.selectedIndex,
                  detailKind: "explanation",
                  detail: question.explanation,
                  canRetry: false,
                  canAdvance: true,
                  isExhausted: false,
                }
              : {
                  verdict: "incorrect",
                  highlightIndex: currentState.selectedIndex,
                  detailKind: isExhausted ? "explanation" : "hint",
                  detail: isExhausted ? question.explanation : question.hint,
                  canRetry: !isExhausted,
                  canAdvance: isExhausted,
                  isExhausted,
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
    currentAttempt: state.feedback
      ? state.attemptsForCurrentQuestion
      : Math.min(state.attemptsForCurrentQuestion + 1, MAX_ATTEMPTS),
    selectedIndex: state.selectedIndex,
    feedback: state.feedback,
    summary,
    isOptionLocked: state.feedback !== null,
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
