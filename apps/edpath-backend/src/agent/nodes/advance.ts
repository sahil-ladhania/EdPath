/**
 * Advance graph node (N8 / advance).
 * Moves to the next question within an objective, or the next objective, resetting per-question state. Explicit user "advance" signal only.
**/
import { MCQS_PER_OBJECTIVE } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

// Define the function to advance the node
export function advanceNode( state: GraphState ): ReturnType<typeof withCoAgentSnapshot> {
  // Get the plan
  const plan = state.plan;

  // Check if the plan is missing
  if (!plan) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "advance",
        kind: "schema_drift",
        detail: "Plan required for advance",
      },
    });
  };

  // Get the next question index
  const nextQuestionIndex = state.currentQuestionIndex + 1;

  // Check if the next question index is less than the number of questions per objective
  if (nextQuestionIndex < MCQS_PER_OBJECTIVE) {
    return withCoAgentSnapshot(state, {
      currentQuestionIndex: nextQuestionIndex,
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      helpThread: [],
      feedback: null,
      phase: "awaiting_input",
    });
  };

  // Get the next objective index
  const nextObjectiveIndex = state.currentObjectiveIndex + 1;

  // Check if the next objective index is less than the number of objectives
  if (nextObjectiveIndex < plan.objectives.length) {
    return withCoAgentSnapshot(state, {
      currentObjectiveIndex: nextObjectiveIndex,
      currentQuestionIndex: 0,
      questions: [],
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      helpThread: [],
      feedback: null,
      phase: "quizzing",
    });
  };

  // Return the co-agent snapshot
  return withCoAgentSnapshot(state, {
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    helpThread: [],
    feedback: null,
    phase: "quizzing",
  });
};

// Define the function to route after advance
export function routeAfterAdvance( state: GraphState ): "await_input" | "generate_mcq" | "summarize" {
  // Get the plan
  const plan = state.plan;

  // Check if the plan is missing
  if (!plan) {
    return "summarize";
  };

  // Get the total number of questions
  const totalQuestions = plan.objectives.length * MCQS_PER_OBJECTIVE;

  // Check if the number of results is greater than or equal to the total number of questions
  if (state.results.length >= totalQuestions) {
    return "summarize";
  };

  // Check if the number of questions is zero
  if (state.questions.length === 0) {
    return "generate_mcq";
  };

  // Return the await input
  return "await_input";
};