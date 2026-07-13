import type { LessonPlan } from "@repo/types";

// Function to get the plan fingerprint
export function getPlanFingerprint(plan: LessonPlan | null): string {
  // Check if the plan is null
  if (plan === null) {
    // Return an empty string
    return "";
  };

  // Return the plan fingerprint
  return JSON.stringify(
    plan.objectives.map(
      (objective) =>
        `${objective.objectiveId}:${objective.title}:${objective.difficulty}`,
    ),
  );
};