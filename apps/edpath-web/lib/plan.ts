/**
 * Plan revision fingerprint — cheap change detection for replan completion.
 */

import type { LessonPlan } from "@repo/types";

/** Serializes objective id, title, and difficulty for before/after comparison. */
export function getPlanFingerprint(plan: LessonPlan | null): string {
  if (!plan) {
    return "";
  }

  return JSON.stringify(
    plan.objectives.map(
      (objective) =>
        `${objective.objectiveId}:${objective.title}:${objective.difficulty}`,
    ),
  );
}
