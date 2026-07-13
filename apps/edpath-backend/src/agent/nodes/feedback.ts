/**
 * Assemble feedback graph node (N7 / assemble_feedback).
 * Builds the green/red feedback payload (hint or explanation) from grading results. 
 * Always routes back to await_input for a stable resting state.
**/
import { FeedbackSchema } from "@repo/schemas";
import type { Feedback } from "@repo/types";
import { MAX_ATTEMPTS } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

// Define the function to feedback the node
export function feedbackNode( state: GraphState ): ReturnType<typeof withCoAgentSnapshot> {
  // Get the MCQ
  const mcq = state.questions[state.currentQuestionIndex];

  // Get the grade output
  const gradeOutput = state.gradeOutput;

  // Get the selected index
  const selectedIndex = state.selectedIndex;

  // Check if the MCQ, grade output, or selected index is missing
  if (!mcq || !gradeOutput || selectedIndex === null) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "feedback",
        kind: "schema_drift",
        detail: "Missing MCQ, grade output, or selectedIndex for feedback",
      },
    });
  };

  // Initialize the feedback
  let feedback: Feedback;

  // Check if the grade output is correct
  if (gradeOutput.verdict === "correct") {
    feedback = {
      verdict: "correct",
      highlightIndex: selectedIndex,
      explanation: mcq.explanation,
      canRetry: false,
    };
  }
  // Check if the grade output is exhausted
  else if (gradeOutput.attempts >= MAX_ATTEMPTS) {
    feedback = {
      verdict: "exhausted",
      highlightIndex: selectedIndex,
      explanation: mcq.explanation,
      canRetry: false,
    };
  }
  // Check if the grade output is incorrect
  else {
    feedback = {
      verdict: "incorrect",
      highlightIndex: selectedIndex,
      hint: mcq.hint,
      canRetry: true,
    };
  };

  // Parse the feedback
  FeedbackSchema.parse(feedback);

  // Return the co-agent snapshot
  return withCoAgentSnapshot(state, {
    feedback,
    phase: "awaiting_input",
    gradeOutput: null,
  });
};