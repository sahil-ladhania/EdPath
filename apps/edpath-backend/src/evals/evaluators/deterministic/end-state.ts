import { SummarySchema } from "@repo/schemas";

import { deriveScore } from "../../../agent/state/derive-score.js";
import { MCQS_PER_OBJECTIVE } from "../../../agent/state/constants.js";
import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult } from "../../types.js";

function buildExpectedSummaryStats(state: GraphState): {
  correct: number;
  total: number;
  firstTry: number;
} {
  const correct = state.results.filter((r) => r.correct).length;
  const total = state.results.length;
  const firstTry = state.results.filter((r) => r.firstTryCorrect).length;
  return { correct, total, firstTry };
}

export function evaluateEndState(state: GraphState): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];

  checks.push({
    name: "phase_complete",
    passed: state.phase === "complete",
    message: `phase=${state.phase}`,
  });

  if (state.summary) {
    const parsed = SummarySchema.safeParse(state.summary);
    checks.push({
      name: "summary_schema_valid",
      passed: parsed.success,
      message: parsed.success
        ? "Summary passes Zod schema"
        : parsed.error.message,
    });
  } else {
    checks.push({
      name: "summary_present",
      passed: false,
      message: "Summary is null",
    });
  }

  if (state.plan) {
    const expectedTotal = state.plan.objectives.length * MCQS_PER_OBJECTIVE;
    checks.push({
      name: "results_count",
      passed: state.results.length === expectedTotal,
      message: `results.length=${state.results.length}, expected=${expectedTotal}`,
    });

    for (const objective of state.plan.objectives) {
      const objResults = state.results.filter(
        (r) => r.objectiveId === objective.objectiveId,
      );
      checks.push({
        name: `objective_covered_${objective.objectiveId}`,
        passed: objResults.length === MCQS_PER_OBJECTIVE,
        message: `Objective ${objective.objectiveId}: ${objResults.length} results`,
      });
    }
  }

  return checks;
}

export function evaluateScoreConsistency(state: GraphState): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];
  const derived = deriveScore(state.results);

  checks.push({
    name: "score_matches_derived",
    passed:
      state.score.correct === derived.correct &&
      state.score.total === derived.total &&
      state.score.firstTry === derived.firstTry,
    message: `state.score=${JSON.stringify(state.score)}, derived=${JSON.stringify(derived)}`,
  });

  if (state.summary && state.phase === "complete") {
    const expected = buildExpectedSummaryStats(state);
    const overall = state.summary.overall;
    checks.push({
      name: "summary_overall_matches_results",
      passed:
        overall.correct === expected.correct &&
        overall.total === expected.total,
      message: `summary.overall=${JSON.stringify(overall)}, expected=${JSON.stringify(expected)}`,
    });

    const expectedFirstTryRate =
      expected.total > 0 ? expected.firstTry / expected.total : 0;
    checks.push({
      name: "summary_first_try_rate",
      passed: Math.abs(overall.firstTryRate - expectedFirstTryRate) < 0.001,
      message: `firstTryRate=${overall.firstTryRate}, expected=${expectedFirstTryRate}`,
    });
  }

  return checks;
}
