/**
 * Per-case evaluator — runs deterministic checks + optional LLM judge per dimension.
 */
import type {
  DimensionEvalResult,
  EvalCase,
  EvalCheckResult,
  EvalDimension,
  ScenarioRunResult,
} from "./types.js";
import { evaluatePlanGrounded } from "./evaluators/deterministic/plan-grounding.js";
import {
  evaluateEndState,
  evaluateScoreConsistency,
} from "./evaluators/deterministic/end-state.js";
import { evaluateMcqsGrounded } from "./evaluators/deterministic/source-anchor.js";
import {
  evaluateAssistLeakage,
  evaluateCoAgentFirewall,
  evaluateFeedbackBehavior,
} from "./evaluators/deterministic/assist-leakage.js";
import { evaluateResumeIntegrity } from "./evaluators/deterministic/resume-integrity.js";
import {
  evaluateAssistLeakageJudge,
  evaluateMcqGroundingJudge,
  evaluatePlanGroundingJudge,
  evaluateSummaryQualityJudge,
} from "./evaluators/llm-judge/index.js";

function dimensionPassed(checks: { passed: boolean }[]): boolean {
  return checks.length > 0 && checks.every((c) => c.passed);
}

function runDeterministicDimension(
  dimension: EvalDimension,
  evalCase: EvalCase,
  runResult: ScenarioRunResult,
): DimensionEvalResult {
  const state = runResult.finalState;
  let checks: EvalCheckResult[] = [];

  switch (dimension) {
    case "plan_grounded":
      checks = evaluatePlanGrounded(state);
      break;
    case "mcqs_grounded":
      checks = evaluateMcqsGrounded(state, runResult.allGeneratedMcqs);
      break;
    case "feedback_behavior":
      checks = [
        ...evaluateFeedbackBehavior(runResult),
        ...evaluateAssistLeakage(runResult),
        ...evaluateCoAgentFirewall(state),
      ];
      break;
    case "loop_state":
      checks = [
        ...evaluateEndState(state),
        ...evaluateScoreConsistency(state),
        ...(evalCase.category === "resume"
          ? evaluateResumeIntegrity(runResult)
          : []),
      ];
      break;
  }

  return {
    dimension,
    passed: dimensionPassed(checks),
    checks,
  };
}

async function runLlmDimension(
  dimension: EvalDimension,
  evalCase: EvalCase,
  runResult: ScenarioRunResult,
  useLlm: boolean,
): Promise<DimensionEvalResult> {
  const deterministic = runDeterministicDimension(dimension, evalCase, runResult);

  if (!useLlm) {
    return deterministic;
  }

  const state = runResult.finalState;
  const llmChecks = [];

  switch (dimension) {
    case "plan_grounded":
      llmChecks.push(await evaluatePlanGroundingJudge(state));
      break;
    case "mcqs_grounded":
      llmChecks.push(...(await evaluateMcqGroundingJudge(state)));
      break;
    case "feedback_behavior":
      if (evalCase.category === "adversarial_help") {
        llmChecks.push(await evaluateAssistLeakageJudge(state, runResult));
      }
      break;
    case "loop_state":
      llmChecks.push(await evaluateSummaryQualityJudge(state));
      break;
  }

  const allChecks = [...deterministic.checks, ...llmChecks];
  return {
    dimension,
    passed: dimensionPassed(allChecks),
    checks: allChecks,
  };
}

export async function evaluateCase(
  evalCase: EvalCase,
  runResult: ScenarioRunResult,
  options: { useLlmJudge?: boolean } = {},
): Promise<{ passed: boolean; dimensions: DimensionEvalResult[] }> {
  const useLlm = options.useLlmJudge ?? false;
  const dimensions: DimensionEvalResult[] = [];

  for (const dimension of evalCase.dimensions) {
    dimensions.push(
      await runLlmDimension(dimension, evalCase, runResult, useLlm),
    );
  }

  return {
    passed: dimensions.every((d) => d.passed),
    dimensions,
  };
}
