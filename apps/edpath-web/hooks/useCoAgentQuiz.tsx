"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CoAgentState, Feedback, LessonPlan, PublicMCQ } from "@repo/types";

import { MAX_ATTEMPTS } from "@/lib/mock-lesson";

interface UseCoAgentQuizOptions {
  state: CoAgentState;
  plan: LessonPlan | null;
  submitAnswer: (selectedIndex: number) => void;
  canSubmitAnswer: boolean;
  isRunning: boolean;
}

interface UseCoAgentQuizReturn {
  currentObjectiveTitle: string;
  currentQuestion: PublicMCQ | null;
  questionNumber: number;
  questionCount: number;
  currentAttempt: number;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  isOptionLocked: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  isWaitingForAnswer: boolean;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  retryQuestion: () => void;
  advance: () => void;
}

export function useCoAgentQuiz({
  state,
  plan,
  submitAnswer: submitAnswerToAgent,
  canSubmitAnswer,
  isRunning,
}: UseCoAgentQuizOptions): UseCoAgentQuizReturn {
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(
    null,
  );
  const [triedOptionIndices, setTriedOptionIndices] = useState<number[]>([]);
  const [retryUnlocked, setRetryUnlocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const pendingSelectionRef = useRef<number | null>(null);
  const previousAttemptsRef = useRef<number>(state.attempts);
  const previousFeedbackRef = useRef<Feedback | null>(state.feedback);

  useEffect(() => {
    setLocalSelectedIndex(null);
    setTriedOptionIndices([]);
    setRetryUnlocked(false);
    setIsSubmitting(false);
    pendingSelectionRef.current = null;
  }, [state.currentQuestionIndex, state.currentObjectiveIndex]);

  useEffect(() => {
    const feedbackChanged = state.feedback !== previousFeedbackRef.current;
    const attemptsChanged = state.attempts !== previousAttemptsRef.current;

    if (feedbackChanged || attemptsChanged) {
      setIsSubmitting(false);
      setLocalSelectedIndex(null);
      pendingSelectionRef.current = null;
    }

    previousFeedbackRef.current = state.feedback;
    previousAttemptsRef.current = state.attempts;
  }, [state.attempts, state.feedback]);

  useEffect(() => {
    if (isSubmitting && !isRunning) {
      setIsSubmitting(false);
    }
  }, [isRunning, isSubmitting]);

  useEffect(() => {
    if (
      state.feedback?.verdict === "incorrect" ||
      state.feedback?.verdict === "exhausted"
    ) {
      const highlightIndex = state.feedback.highlightIndex;
      setTriedOptionIndices((current) =>
        current.includes(highlightIndex)
          ? current
          : [...current, highlightIndex],
      );
    }
  }, [state.feedback]);

  const currentObjective = plan?.objectives[state.currentObjectiveIndex];
  const currentQuestion = state.questions[state.currentQuestionIndex] ?? null;
  const feedback = state.feedback;

  const isOptionLocked = useMemo((): boolean => {
    if (isSubmitting || isRunning) {
      return true;
    }

    if (!feedback) {
      return false;
    }

    if (feedback.canRetry && retryUnlocked) {
      return false;
    }

    return true;
  }, [feedback, isRunning, isSubmitting, retryUnlocked]);

  const canSubmit = useMemo((): boolean => {
    const maySubmitAfterRetry = retryUnlocked && feedback?.canRetry === true;

    return (
      localSelectedIndex !== null &&
      canSubmitAnswer &&
      !isSubmitting &&
      (feedback === null || maySubmitAfterRetry)
    );
  }, [
    canSubmitAnswer,
    feedback,
    isSubmitting,
    localSelectedIndex,
    retryUnlocked,
  ]);

  const isWaitingForAnswer = useMemo((): boolean => {
    return (
      localSelectedIndex !== null &&
      !canSubmitAnswer &&
      !isSubmitting &&
      (feedback === null || (retryUnlocked && feedback?.canRetry === true))
    );
  }, [
    canSubmitAnswer,
    feedback,
    isSubmitting,
    localSelectedIndex,
    retryUnlocked,
  ]);

  const selectOption = useCallback(
    (index: number): void => {
      if (isOptionLocked) {
        return;
      }

      setLocalSelectedIndex(index);
    },
    [isOptionLocked],
  );

  const submitAnswer = useCallback((): void => {
    if (localSelectedIndex === null) {
      return;
    }

    if (!canSubmitAnswer) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[EdPath] submitAnswer blocked: await_input interrupt resolver is not ready.",
        );
      }
      return;
    }

    pendingSelectionRef.current = localSelectedIndex;
    setIsSubmitting(true);
    submitAnswerToAgent(localSelectedIndex);
  }, [canSubmitAnswer, localSelectedIndex, submitAnswerToAgent]);

  const retryQuestion = useCallback((): void => {
    setLocalSelectedIndex(null);
    setRetryUnlocked(true);
    setIsSubmitting(false);
    pendingSelectionRef.current = null;
  }, []);

  const advance = useCallback((): void => {
    // Correct/exhausted answers auto-advance server-side (feedback → advance).
    // Clear local retry state so the next mirrored question starts fresh.
    setRetryUnlocked(false);
    setLocalSelectedIndex(null);
    setIsSubmitting(false);
    pendingSelectionRef.current = null;
  }, []);

  return {
    currentObjectiveTitle: currentObjective?.title ?? "Current objective",
    currentQuestion,
    questionNumber: state.currentQuestionIndex + 1,
    questionCount: state.questions.length,
    currentAttempt: feedback
      ? state.attempts
      : Math.min(state.attempts + 1, MAX_ATTEMPTS),
    selectedIndex: localSelectedIndex,
    triedOptionIndices,
    feedback,
    isOptionLocked,
    isSubmitting,
    canSubmit,
    isWaitingForAnswer,
    selectOption,
    submitAnswer,
    retryQuestion,
    advance,
  };
}
