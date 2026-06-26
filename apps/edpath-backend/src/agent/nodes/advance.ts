import { MCQS_PER_OBJECTIVE } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

export function advanceNode(
  state: GraphState,
): ReturnType<typeof withCoAgentSnapshot> {
  const plan = state.plan;
  if (!plan) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "advance",
        kind: "schema_drift",
        detail: "Plan required for advance",
      },
    });
  }

  const nextQuestionIndex = state.currentQuestionIndex + 1;

  if (nextQuestionIndex < MCQS_PER_OBJECTIVE) {
    return withCoAgentSnapshot(state, {
      currentQuestionIndex: nextQuestionIndex,
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      feedback: null,
      phase: "awaiting_input",
    });
  }

  const nextObjectiveIndex = state.currentObjectiveIndex + 1;

  if (nextObjectiveIndex < plan.objectives.length) {
    return withCoAgentSnapshot(state, {
      currentObjectiveIndex: nextObjectiveIndex,
      currentQuestionIndex: 0,
      questions: [],
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      feedback: null,
      phase: "quizzing",
    });
  }

  return withCoAgentSnapshot(state, {
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    feedback: null,
    phase: "quizzing",
  });
}

/** Routing helper after advance node. */
export function routeAfterAdvance(
  state: GraphState,
): "await_input" | "generate_mcq" | "summarize" {
  const plan = state.plan;
  if (!plan) {
    return "summarize";
  }

  const totalQuestions = plan.objectives.length * MCQS_PER_OBJECTIVE;
  if (state.results.length >= totalQuestions) {
    return "summarize";
  }

  if (state.questions.length === 0) {
    return "generate_mcq";
  }

  return "await_input";
}
