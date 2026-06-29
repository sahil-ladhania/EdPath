"use client";

/**
 * Quiz UX hook — local selection, retry, and help-submit state layered on mirrored CoAgent state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Feedback } from "@repo/types";

import { MAX_ATTEMPTS } from "@repo/schemas/constants";

import type { UseCoAgentQuizOptions, UseCoAgentQuizReturn } from "@/types/mcq";

/**
 * Manages quiz interaction UX while the graph owns grading and feedback.
 * Sends intents via callbacks; resets local state on question/objective changes.
 */
export function useCoAgentQuiz({
  state,
  plan,
  submitAnswer: submitAnswerToAgent,
  submitHelp: submitHelpToAgent,
  advance: advanceToAgent,
  canSubmitAnswer,
  canSubmitHelp,
  isRunning,
}: UseCoAgentQuizOptions): UseCoAgentQuizReturn {
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(
    null,
  );
  const [triedOptionIndices, setTriedOptionIndices] = useState<number[]>([]);
  const [retryUnlocked, setRetryUnlocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isHelpSubmitting, setIsHelpSubmitting] = useState<boolean>(false);
  const pendingSelectionRef = useRef<number | null>(null);
  const helpThreadLengthAtSubmitRef = useRef<number>(0);
  const previousAttemptsRef = useRef<number>(state.attempts);
  const previousFeedbackRef = useRef<Feedback | null>(state.feedback);

  useEffect(() => {
    setLocalSelectedIndex(null);
    setTriedOptionIndices([]);
    setRetryUnlocked(false);
    setIsSubmitting(false);
    setIsHelpSubmitting(false);
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
    if (!isHelpSubmitting) {
      return;
    }

    const hasNewMessages =
      state.helpThread.length > helpThreadLengthAtSubmitRef.current;
    const latestMessage = state.helpThread.at(-1);

    // Mirrored assist reply for this turn landed — re-enable input.
    if (hasNewMessages && latestMessage?.role === "assistant") {
      setIsHelpSubmitting(false);
      return;
    }

    // Fallback if the run finished without a mirrored reply (transport error, etc.).
    if (!isRunning) {
      setIsHelpSubmitting(false);
    }
  }, [isHelpSubmitting, isRunning, state.helpThread]);

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
    // Only lock radios while an answer is being graded — not during help turns.
    if (isSubmitting) {
      return true;
    }

    if (!feedback) {
      return false;
    }

    if (feedback.canRetry && retryUnlocked) {
      return false;
    }

    return true;
  }, [feedback, isSubmitting, retryUnlocked]);

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

  const submitHelp = useCallback(
    (text: string): void => {
      if (!canSubmitHelp) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[EdPath] submitHelp blocked: await_input interrupt resolver is not ready.",
          );
        }
        return;
      }

      setIsHelpSubmitting(true);
      helpThreadLengthAtSubmitRef.current = state.helpThread.length;
      submitHelpToAgent(text);
    },
    [canSubmitHelp, state.helpThread.length, submitHelpToAgent],
  );

  const retryQuestion = useCallback((): void => {
    setLocalSelectedIndex(null);
    setRetryUnlocked(true);
    setIsSubmitting(false);
    pendingSelectionRef.current = null;
  }, []);

  const advance = useCallback((): void => {
    // "Next question" after correct/exhausted feedback. The graph paused at the
    // await_input interrupt holding the feedback; send the advance signal so it
    // moves on, and clear local retry state for the next mirrored question.
    setRetryUnlocked(false);
    setLocalSelectedIndex(null);
    setIsSubmitting(false);
    pendingSelectionRef.current = null;
    advanceToAgent();
  }, [advanceToAgent]);

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
    isHelpSubmitting,
    canSubmit,
    isWaitingForAnswer,
    selectOption,
    submitAnswer,
    submitHelp,
    retryQuestion,
    advance,
  };
}
