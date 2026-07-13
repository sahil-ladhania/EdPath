"use client";

// Import React hooks and types
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Feedback } from "@repo/types";
import { MAX_ATTEMPTS } from "@repo/schemas/constants";
import type { UseCoAgentQuizOptions, UseCoAgentQuizReturn } from "@/types/mcq";

// Function to use the CoAgent quiz
export function useCoAgentQuiz({ state, plan, submitAnswer: submitAnswerToAgent, submitHelp: submitHelpToAgent, advance: advanceToAgent,  canSubmitAnswer, canSubmitHelp, isRunning }: UseCoAgentQuizOptions): UseCoAgentQuizReturn {
  // useState Hook to store the local selected index
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(null);
  // useState Hook to store the tried option indices
  const [triedOptionIndices, setTriedOptionIndices] = useState<number[]>([]);
  // useState Hook to store the retry unlocked state
  const [retryUnlocked, setRetryUnlocked] = useState<boolean>(false);
  // useState Hook to store the submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // useState Hook to store the help submitting state
  const [isHelpSubmitting, setIsHelpSubmitting] = useState<boolean>(false);
  
  // useRef Hook to store the pending selection
  const pendingSelectionRef = useRef<number | null>(null);
  // useRef Hook to store the help thread length at submit
  const helpThreadLengthAtSubmitRef = useRef<number>(0);
  // useRef Hook to store the previous attempts
  const previousAttemptsRef = useRef<number>(state.attempts);
  // useRef Hook to store the previous feedback
  const previousFeedbackRef = useRef<Feedback | null>(state.feedback);

  // useEffect Hook to reset the local state when the current question or objective changes
  useEffect(() => {
    setLocalSelectedIndex(null);
    setTriedOptionIndices([]);
    setRetryUnlocked(false);
    setIsSubmitting(false);
    setIsHelpSubmitting(false);
    pendingSelectionRef.current = null;
  }, [state.currentQuestionIndex, state.currentObjectiveIndex]);

  // useEffect Hook to check if the feedback or attempts have changed
  useEffect(() => {
    // Check if the feedback has changed
    const feedbackChanged = state.feedback !== previousFeedbackRef.current;
    // Check if the attempts have changed
    const attemptsChanged = state.attempts !== previousAttemptsRef.current;

    // Reset the submitting state if the feedback or attempts have changed
    if (feedbackChanged || attemptsChanged) {
      setIsSubmitting(false);
      setLocalSelectedIndex(null);
      pendingSelectionRef.current = null;
    };

    // Update the previous feedback and attempts
    previousFeedbackRef.current = state.feedback;
    // Update the previous attempts
    previousAttemptsRef.current = state.attempts;
  }, [state.attempts, state.feedback]);

  // useEffect Hook to reset the submitting state if the run is not running
  useEffect(() => {
    // Check if the submitting state is true and the run is not running
    if (isSubmitting && !isRunning) {
      setIsSubmitting(false);
    };
  }, [isRunning, isSubmitting]);

  // useEffect Hook to reset the help submitting state if the help thread has new messages
  useEffect(() => {
    // Check if the help submitting state is false
    if (!isHelpSubmitting) {
      return;
    };

    // Check if the help thread has new messages
    const hasNewMessages = state.helpThread.length > helpThreadLengthAtSubmitRef.current;
    // Get the latest message
    const latestMessage = state.helpThread.at(-1);

    // Check if the latest message is an assistant message
    if (hasNewMessages && latestMessage?.role === "assistant") {
      setIsHelpSubmitting(false);
      return;
    };

    // Reset the help submitting state if the run finished without a mirrored reply (transport error, etc.)
    if (!isRunning) {
      setIsHelpSubmitting(false);
    };
  }, [isHelpSubmitting, isRunning, state.helpThread]);

  // useEffect Hook to add the highlighted index to the tried option indices
  useEffect(() => {
    // Check if the feedback is incorrect or exhausted
    if ( state.feedback?.verdict === "incorrect" || state.feedback?.verdict === "exhausted" ) {
      // Get the highlight index
      const highlightIndex = state.feedback.highlightIndex;
      
      // Add the highlight index to the tried option indices if it is not already in the array
      setTriedOptionIndices((current) =>
        current.includes(highlightIndex)
          ? current
          : [...current, highlightIndex],
      );
    };
  }, [state.feedback]);

  // Get the current objective
  const currentObjective = plan?.objectives[state.currentObjectiveIndex];
  // Get the current question
  const currentQuestion = state.questions[state.currentQuestionIndex] ?? null;
  // Get the feedback
  const feedback = state.feedback;

  // useMemo Hook to check if the option is locked
  const isOptionLocked = useMemo((): boolean => {
    // Check if the submitting state is true
    if (isSubmitting) {
      return true;
    };

    // Check if the feedback is null
    if (!feedback) {
      return false;
    };

    // Check if the feedback can be retried and the retry is unlocked
    if (feedback.canRetry && retryUnlocked) {
      return false;
    };

    return true;
  }, [feedback, isSubmitting, retryUnlocked]);

  // useMemo Hook to check if the answer can be submitted
  const canSubmit = useMemo((): boolean => {
    // Check if the feedback can be retried and the retry is unlocked
    const maySubmitAfterRetry = retryUnlocked && feedback?.canRetry === true;

    // Return true if the local selected index is not null, the answer can be submitted, the submitting state is false, and the feedback is null or the feedback can be retried and the retry is unlocked
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

  // useMemo Hook to check if the user is waiting for an answer
  const isWaitingForAnswer = useMemo((): boolean => {
    // Return true if the local selected index is not null, the answer cannot be submitted, the submitting state is false, and the feedback is null or the feedback can be retried and the retry is unlocked
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

  // useCallback Hook to select an option
  const selectOption = useCallback(
    // Function to select an option
    (index: number): void => {
      // Check if the option is locked
      if (isOptionLocked) {
        return;
      };

      // Set the local selected index
      setLocalSelectedIndex(index);
    },
    [isOptionLocked],
  );

  // useCallback Hook to submit an answer
  const submitAnswer = useCallback((): void => {
    // Check if the local selected index is null
    if (localSelectedIndex === null) {
      return;
    };

    // Check if the answer cannot be submitted
    if (!canSubmitAnswer) {
      // Check if the environment is development
      if (process.env.NODE_ENV === "development") {
        console.warn( "[EdPath] submitAnswer blocked: await_input interrupt resolver is not ready.");
      };

      return;
    };

    // Set the pending selection
    pendingSelectionRef.current = localSelectedIndex;
    // Set the submitting state
    setIsSubmitting(true);
    // Submit the answer to the agent
    submitAnswerToAgent(localSelectedIndex);
  }, [canSubmitAnswer, localSelectedIndex, submitAnswerToAgent]);

  // useCallback Hook to submit help
  const submitHelp = useCallback(
    // Function to submit help
    (text: string): void => {
      // Check if the help cannot be submitted
      if (!canSubmitHelp) {
        // Check if the environment is development
        if (process.env.NODE_ENV === "development") {
          console.warn( "[EdPath] submitHelp blocked: await_input interrupt resolver is not ready." );
        };

        return;
      };

      // Set the help submitting state
      setIsHelpSubmitting(true);
      // Set the help thread length at submit
      helpThreadLengthAtSubmitRef.current = state.helpThread.length;
      // Submit the help to the agent
      submitHelpToAgent(text);
    },
    [canSubmitHelp, state.helpThread.length, submitHelpToAgent],
  );

  // useCallback Hook to retry the question
  const retryQuestion = useCallback((): void => {
    // Set the local selected index to null
    setLocalSelectedIndex(null);
    // Set the retry unlocked state to true
    setRetryUnlocked(true);
    // Set the submitting state to false
    setIsSubmitting(false);
    // Set the pending selection to null
    pendingSelectionRef.current = null;
  }, []);

  // useCallback Hook to advance to the next question
  const advance = useCallback((): void => {
    // Set the retry unlocked state to false
    setRetryUnlocked(false);
    // Set the local selected index to null
    setLocalSelectedIndex(null);
    // Set the submitting state to false
    setIsSubmitting(false);
    // Set the pending selection to null
    pendingSelectionRef.current = null;
    // Advance to the next question
    advanceToAgent();
  }, [advanceToAgent]);

  // Return the quiz state
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
};