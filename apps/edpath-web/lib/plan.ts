import type { LessonPlan } from "@repo/types";

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
