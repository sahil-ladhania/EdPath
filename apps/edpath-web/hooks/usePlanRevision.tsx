"use client";

// Import React hooks and types
import { useCallback, useEffect, useRef, useState } from "react";
import { getPlanFingerprint } from "@/lib/plan";
import type { UsePlanRevisionOptions, UsePlanRevisionReturn } from "@/types/plan";

// Function to use the plan revision
export function usePlanRevision({ plan, isRunning, requestPlanRevision, canRequestPlanRevision }: UsePlanRevisionOptions): UsePlanRevisionReturn {
  // useState Hook to store the submitting state    
  const [isReviseSubmitting, setIsReviseSubmitting] = useState<boolean>(false);

  // useRef Hook to store the plan fingerprint at submit
  const planFingerprintAtSubmitRef = useRef<string>("");
  // useRef Hook to store the saw running since submit state
  const sawRunningSinceSubmitRef = useRef<boolean>(false);

  // useEffect Hook to check if the submitting state is true and the run is running
  useEffect(() => {
    // Check if the submitting state is true and the run is running
    if (isReviseSubmitting && isRunning) {
      sawRunningSinceSubmitRef.current = true;
    };
  }, [isReviseSubmitting, isRunning]);

  // useEffect Hook to check if the submitting state is false and the run is not running
  useEffect(() => {
    // Check if the submitting state is false
    if (!isReviseSubmitting) {
      return;
    };

    // Get the current fingerprint
    const currentFingerprint = getPlanFingerprint(plan);
    // Check if the plan has changed
    const planChanged = plan !== null && currentFingerprint !== planFingerprintAtSubmitRef.current;

    // Check if the plan has changed
    if (planChanged) {
      // Set the submitting state to false
      setIsReviseSubmitting(false);
      // Set the saw running since submit state to false
      sawRunningSinceSubmitRef.current = false;
      return;
    };

    // Check if the run is not running and the saw running since submit state is true
    if (!isRunning && sawRunningSinceSubmitRef.current) {
      // Set the submitting state to false
      setIsReviseSubmitting(false);
      // Set the saw running since submit state to false
      sawRunningSinceSubmitRef.current = false;
    };
  }, [isReviseSubmitting, isRunning, plan]);

  // useCallback Hook to submit a revision
  const submitRevision = useCallback(
    // Function to submit a revision
    (note: string): void => {
      // Trim the note
      const trimmed = note.trim();
      // Check if the note is empty, the plan revision cannot be requested, or the submitting state is true
      if (!trimmed || !canRequestPlanRevision || isReviseSubmitting) {
        // Check if the note is empty or the submitting state is true
        if (!trimmed || isReviseSubmitting) {
          return;
        };

        // Check if the environment is development
        if (process.env.NODE_ENV === "development") {
          console.warn( "[EdPath] submitRevision blocked: approval interrupt resolver is not ready." );
        };

        return;
      };

      // Set the saw running since submit state to false
      sawRunningSinceSubmitRef.current = false;
      // Set the plan fingerprint at submit
      planFingerprintAtSubmitRef.current = getPlanFingerprint(plan);
      // Set the submitting state to true
      setIsReviseSubmitting(true);
      // Request the plan revision
      requestPlanRevision(trimmed);
    },
    [canRequestPlanRevision, isReviseSubmitting, plan, requestPlanRevision],
  );

  // Return the plan revision options
  return {
    isReviseSubmitting,
    canSubmitRevision: canRequestPlanRevision && !isReviseSubmitting,
    submitRevision,
  };
};