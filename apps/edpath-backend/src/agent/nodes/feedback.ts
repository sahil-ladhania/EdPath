import { FeedbackSchema } from "@repo/schemas";
import type { Feedback } from "@repo/types";

import { MAX_ATTEMPTS } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

export function feedbackNode(
  state: GraphState,
): ReturnType<typeof withCoAgentSnapshot> {
  const mcq = state.questions[state.currentQuestionIndex];
  const gradeOutput = state.gradeOutput;
  const selectedIndex = state.selectedIndex;

  if (!mcq || !gradeOutput || selectedIndex === null) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "feedback",
        kind: "schema_drift",
        detail: "Missing MCQ, grade output, or selectedIndex for feedback",
      },
    });
  }

  let feedback: Feedback;

  if (gradeOutput.verdict === "correct") {
    feedback = {
      verdict: "correct",
      highlightIndex: selectedIndex,
      correctIndex: mcq.correctIndex,
      explanation: mcq.explanation,
      canRetry: false,
    };
  } else if (gradeOutput.attempts >= MAX_ATTEMPTS) {
    feedback = {
      verdict: "exhausted",
      highlightIndex: selectedIndex,
      explanation: mcq.explanation,
      canRetry: false,
    };
  } else {
    feedback = {
      verdict: "incorrect",
      highlightIndex: selectedIndex,
      hint: mcq.hint,
      canRetry: true,
    };
  }

  FeedbackSchema.parse(feedback);

  return withCoAgentSnapshot(state, {
    feedback,
    phase: "awaiting_input",
    gradeOutput: null,
  });
}

/** Routing helper after feedback node. */
export function routeAfterFeedback(state: GraphState): "advance" | "await_input" {
  if (!state.feedback) {
    return "await_input";
  }
  if (state.feedback.verdict === "incorrect") {
    return "await_input";
  }
  return "advance";
}
