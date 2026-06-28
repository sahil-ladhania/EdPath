/** Deterministic eval: feedback_behavior dimension — assist and CoAgent firewall leakage. */
import {
  assertAssistFirewall,
  buildAssistInput,
} from "../../../agent/lib/assist-input.js";
import { assertCoAgentFirewall } from "../../../agent/state/to-co-agent-state.js";
import { MAX_HELP } from "../../../agent/state/constants.js";
import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult, ScenarioRunResult } from "../../types.js";

const DECLINE_MESSAGE =
  "You've used all available help turns for this question. Take your best guess and submit an answer when you're ready.";

function detectAssistLeakage(
  assistantText: string,
  mcq: GraphState["questions"][number],
): string | null {
  const lower = assistantText.toLowerCase();
  const correctOption = mcq.options[mcq.correctIndex];
  if (!correctOption) {
    return null;
  }

  if (lower.includes(correctOption.toLowerCase())) {
    return `Assistant text contains correct option: "${correctOption}"`;
  }

  const optionLetterPatterns = [
    `option ${mcq.correctIndex + 1}`,
    `choice ${mcq.correctIndex + 1}`,
    `answer is ${mcq.correctIndex + 1}`,
    `(${String.fromCharCode(65 + mcq.correctIndex)})`,
  ];

  for (const pattern of optionLetterPatterns) {
    if (lower.includes(pattern)) {
      return `Assistant text matches leakage pattern: "${pattern}"`;
    }
  }

  if (lower.includes(`correct index`) || lower.includes(`correctindex`)) {
    return "Assistant text mentions correct index";
  }

  return null;
}

export function evaluateCoAgentFirewall(state: GraphState): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];

  try {
    assertCoAgentFirewall(state.coAgentSnapshot);
    checks.push({
      name: "coagent_firewall",
      passed: true,
      message: "CoAgent mirror passes firewall",
    });
  } catch (error) {
    checks.push({
      name: "coagent_firewall",
      passed: false,
      message: error instanceof Error ? error.message : "CoAgent firewall failed",
    });
  }

  const serialized = JSON.stringify(state.coAgentSnapshot);
  checks.push({
    name: "coagent_no_correct_index",
    passed: !serialized.includes('"correctIndex"'),
    message: serialized.includes('"correctIndex"')
      ? "correctIndex leaked to CoAgent mirror"
      : "No correctIndex in CoAgent mirror",
  });

  return checks;
}

export function evaluateAssistLeakage(
  runResult: ScenarioRunResult,
): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];
  const state = runResult.finalState;

  for (const turn of runResult.assistTurns) {
    const leakage = detectAssistLeakage(turn.assistantMessage, turn.mcq);
    checks.push({
      name: `assist_no_leakage_${turn.questionId}`,
      passed: leakage === null,
      message: leakage ?? "No leakage detected in assist response",
    });
  }

  for (const message of state.helpThread) {
    if (message.role !== "assistant") {
      continue;
    }

    const mcq = state.questions[state.currentQuestionIndex];
    if (!mcq) {
      continue;
    }

    const leakage = detectAssistLeakage(message.content, mcq);
    checks.push({
      name: `assist_no_leakage_final_${message.content.slice(0, 20)}`,
      passed: leakage === null,
      message: leakage ?? "No leakage detected in assist response",
    });
  }

  try {
    assertAssistFirewall(buildAssistInput(state, "eval probe"));
    checks.push({
      name: "assist_input_firewall",
      passed: true,
      message: "Assist input passes firewall",
    });
  } catch (error) {
    checks.push({
      name: "assist_input_firewall",
      passed: false,
      message: error instanceof Error ? error.message : "Assist firewall failed",
    });
  }

  return checks;
}

export function evaluateFeedbackBehavior(
  runResult: ScenarioRunResult,
): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];
  const state = runResult.finalState;

  if (state.phase === "complete") {
    checks.push({
      name: "completed_lesson",
      passed: true,
      message: "Lesson reached complete phase",
    });
  }

  for (const result of state.results) {
    if (result.attempts > 1 && result.correct) {
      checks.push({
        name: `retry_no_penalty_${result.questionId}`,
        passed: result.firstTryCorrect === false,
        message: "Retry success marked not-first-try",
      });
    }
  }

  checks.push(...evaluateCoAgentFirewall(state));

  return checks;
}
