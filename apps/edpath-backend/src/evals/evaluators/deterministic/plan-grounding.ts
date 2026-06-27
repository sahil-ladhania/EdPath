import { LessonPlanSchema } from "@repo/schemas";

import { MAX_OBJECTIVES } from "../../../agent/state/constants.js";
import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult } from "../../types.js";

export function evaluatePlanGrounded(state: GraphState): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];

  if (!state.plan) {
    checks.push({
      name: "plan_present",
      passed: false,
      message: "Plan is null",
    });
    return checks;
  }

  const parsed = LessonPlanSchema.safeParse(state.plan);
  checks.push({
    name: "plan_schema_valid",
    passed: parsed.success,
    message: parsed.success ? "Plan passes Zod schema" : parsed.error.message,
  });

  const count = state.plan.objectives.length;
  checks.push({
    name: "objective_count_bounds",
    passed: count >= 1 && count <= MAX_OBJECTIVES,
    message: `Objective count ${count} (expected 1–${MAX_OBJECTIVES})`,
  });

  for (const objective of state.plan.objectives) {
    const hasContent =
      objective.title.trim().length > 0 &&
      objective.description.trim().length > 0;
    checks.push({
      name: `objective_${objective.objectiveId}_non_empty`,
      passed: hasContent,
      message: hasContent
        ? "Objective has title and description"
        : "Objective missing title or description",
    });
  }

  return checks;
}
