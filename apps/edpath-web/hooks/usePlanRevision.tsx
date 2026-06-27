"use client";

/**
 * Plan revision hook — tracks replan-in-flight via plan fingerprint and `isRunning`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { getPlanFingerprint } from "@/lib/plan";
import type { UsePlanRevisionOptions, UsePlanRevisionReturn } from "@/types/plan";

/**
 * Wraps `requestPlanRevision` with submit/idle detection — the agent is idle at
 * the approval interrupt, so completion requires a fingerprint change or a run
 * that started and then finished.
 */
export function usePlanRevision({
  plan,
  isRunning,
  requestPlanRevision,
  canRequestPlanRevision,
}: UsePlanRevisionOptions): UsePlanRevisionReturn {
  const [isReviseSubmitting, setIsReviseSubmitting] = useState<boolean>(false);
  const planFingerprintAtSubmitRef = useRef<string>("");
  const sawRunningSinceSubmitRef = useRef<boolean>(false);

  useEffect(() => {
    if (isReviseSubmitting && isRunning) {
      sawRunningSinceSubmitRef.current = true;
    }
  }, [isReviseSubmitting, isRunning]);

  useEffect(() => {
    if (!isReviseSubmitting) {
      return;
    }

    const currentFingerprint = getPlanFingerprint(plan);
    const planChanged =
      plan !== null &&
      currentFingerprint !== planFingerprintAtSubmitRef.current;

    if (planChanged) {
      setIsReviseSubmitting(false);
      sawRunningSinceSubmitRef.current = false;
      return;
    }

    // At the approval interrupt the agent is idle (`isRunning === false`).
    // Only treat idle as completion after the replan run actually started.
    if (!isRunning && sawRunningSinceSubmitRef.current) {
      setIsReviseSubmitting(false);
      sawRunningSinceSubmitRef.current = false;
    }
  }, [isReviseSubmitting, isRunning, plan]);

  const submitRevision = useCallback(
    (note: string): void => {
      const trimmed = note.trim();

      if (!trimmed || !canRequestPlanRevision || isReviseSubmitting) {
        if (!trimmed || isReviseSubmitting) {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[EdPath] submitRevision blocked: approval interrupt resolver is not ready.",
          );
        }
        return;
      }

      sawRunningSinceSubmitRef.current = false;
      planFingerprintAtSubmitRef.current = getPlanFingerprint(plan);
      setIsReviseSubmitting(true);
      requestPlanRevision(trimmed);
    },
    [canRequestPlanRevision, isReviseSubmitting, plan, requestPlanRevision],
  );

  return {
    isReviseSubmitting,
    canSubmitRevision: canRequestPlanRevision && !isReviseSubmitting,
    submitRevision,
  };
}
