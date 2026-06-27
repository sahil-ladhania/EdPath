import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult, ScenarioRunResult } from "../../types.js";

export function evaluateResumeIntegrity(
  runResult: ScenarioRunResult,
): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];
  const { checkpointState, finalState, snapshots } = runResult;

  if (!checkpointState) {
    checks.push({
      name: "checkpoint_saved",
      passed: false,
      message: "No checkpoint state was saved during scenario",
    });
    return checks;
  }

  checks.push({
    name: "checkpoint_phase_preserved",
    passed:
      checkpointState.phase === "awaiting_approval" ||
      checkpointState.phase === "awaiting_input",
    message: `Checkpoint phase=${checkpointState.phase}`,
  });

  checks.push({
    name: "resume_reached_complete",
    passed: finalState.phase === "complete",
    message: `Final phase=${finalState.phase}`,
  });

  checks.push({
    name: "progress_advanced_after_resume",
    passed: finalState.results.length >= checkpointState.results.length,
    message: `Results grew from ${checkpointState.results.length} to ${finalState.results.length}`,
  });

  if (snapshots.length >= 2) {
    checks.push({
      name: "snapshots_recorded",
      passed: true,
      message: `${snapshots.length} state snapshots recorded`,
    });
  }

  if (checkpointState.plan && finalState.plan) {
    checks.push({
      name: "plan_preserved_after_resume",
      passed:
        checkpointState.plan.objectives.length ===
        finalState.plan.objectives.length,
      message: "Plan objective count preserved across resume",
    });
  }

  return checks;
}

export function evaluateMidQuizCheckpoint(
  checkpoint: GraphState,
  afterResume: GraphState,
): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];

  checks.push({
    name: "same_question_after_wrong",
    passed:
      checkpoint.currentQuestionIndex === afterResume.currentQuestionIndex ||
      afterResume.results.length > checkpoint.results.length,
    message: "Question index consistent or advanced after resume",
  });

  checks.push({
    name: "attempts_preserved_or_incremented",
    passed: afterResume.attempts >= checkpoint.attempts,
    message: `attempts ${checkpoint.attempts} → ${afterResume.attempts}`,
  });

  return checks;
}
