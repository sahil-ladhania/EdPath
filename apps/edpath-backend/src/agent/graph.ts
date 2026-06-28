/**
 * Graph wiring — nodes + conditional edges; control flow is deterministic.
 *
 * Compiles the Plan → Approve → Quiz → Summarize workflow. Routing fns
 * (routeAfter*) live here; the LLM never chooses the next step.
 */
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { approvalGateNode } from "./nodes/approval-gate.js";
import { advanceNode, routeAfterAdvance } from "./nodes/advance.js";
import { assistNode } from "./nodes/assist.js";
import { awaitInputNode } from "./nodes/await-input.js";
import { feedbackNode } from "./nodes/feedback.js";
import { generateMcqNode } from "./nodes/generate-mcq.js";
import { gradeNode } from "./nodes/grade.js";
import { planNode } from "./nodes/plan.js";
import { summarizeNode } from "./nodes/summarize.js";
import { EdPathStateAnnotation, type GraphState } from "./state/annotation.js";
import { CoAgentStateOutputAnnotation } from "./state/co-agent-output-annotation.js";
import { MAX_REPAIR } from "./state/constants.js";

function routeAfterApproval(
  state: GraphState,
): "plan_lesson" | "generate_mcq" {
  if (state.approval?.decision === "changes") {
    return "plan_lesson";
  }
  return "generate_mcq";
}

function routeAfterPlan(state: GraphState): "approval_gate" | typeof END {
  if (state.plan && state.lastError === null) {
    return "approval_gate";
  }
  return END;
}

export function routeAfterGenerateMcq(
  state: GraphState,
): "await_input" | "generate_mcq" {
  if (state.questions.length > 0 && state.lastError === null) {
    return "await_input";
  }

  if (
    state.lastError?.node === "generate_mcq" &&
    state.mcqGenAttempts <= MAX_REPAIR
  ) {
    return "generate_mcq";
  }

  // Retry budget exhausted: pause at await_input surfacing the error so the user
  // can retry, instead of dead-ending at END with no way forward (G8).
  return "await_input";
}

export function routeAfterAwaitInput(
  state: GraphState,
): "assist" | "grade" | "advance" | "generate_mcq" {
  if (state.pendingResumeKind === "help") {
    return "assist";
  }
  if (state.pendingResumeKind === "advance") {
    return "advance";
  }
  if (state.pendingResumeKind === "retry") {
    return "generate_mcq";
  }
  return "grade";
}

function routeAfterGrade(
  state: GraphState,
): "assemble_feedback" | "await_input" {
  if (state.lastError?.node === "grade" && state.lastError.kind === "grading") {
    return "await_input";
  }
  return "assemble_feedback";
}

function createEdPathWorkflow() {
  return new StateGraph(EdPathStateAnnotation, {
    output: CoAgentStateOutputAnnotation,
  })
    .addNode("plan_lesson", planNode)
    .addNode("approval_gate", approvalGateNode)
    .addNode("generate_mcq", generateMcqNode)
    .addNode("await_input", awaitInputNode)
    .addNode("assist", assistNode)
    .addNode("grade", gradeNode)
    .addNode("assemble_feedback", feedbackNode)
    .addNode("advance", advanceNode)
    .addNode("summarize", summarizeNode)
    .addEdge(START, "plan_lesson")
    .addConditionalEdges("plan_lesson", routeAfterPlan, {
      approval_gate: "approval_gate",
      [END]: END,
    })
    .addConditionalEdges("approval_gate", routeAfterApproval, {
      plan_lesson: "plan_lesson",
      generate_mcq: "generate_mcq",
    })
    .addConditionalEdges("generate_mcq", routeAfterGenerateMcq, {
      await_input: "await_input",
      generate_mcq: "generate_mcq",
    })
    .addConditionalEdges("await_input", routeAfterAwaitInput, {
      assist: "assist",
      grade: "grade",
      advance: "advance",
      generate_mcq: "generate_mcq",
    })
    .addEdge("assist", "await_input")
    .addConditionalEdges("grade", routeAfterGrade, {
      assemble_feedback: "assemble_feedback",
      await_input: "await_input",
    })
    // Feedback always pauses at await_input so green+explanation / red+hint is a
    // stable, readable resting state. Correct/exhausted advance only on the
    // user's explicit "advance" signal (routed from await_input above).
    .addEdge("assemble_feedback", "await_input")
    .addConditionalEdges("advance", routeAfterAdvance, {
      await_input: "await_input",
      generate_mcq: "generate_mcq",
      summarize: "summarize",
    })
    .addEdge("summarize", END);
}

export function createEdPathGraph(): ReturnType<
  ReturnType<typeof createEdPathWorkflow>["compile"]
> {
  // Durable persistence is owned by the LangGraph deployment layer, which
  // checkpoints threads server-side; MemorySaver is only the in-process default
  // used when compiling the graph locally and in tests.
  return createEdPathWorkflow().compile({
    checkpointer: new MemorySaver(),
  });
}

export const graph = createEdPathGraph();

export { createEdPathWorkflow };
