import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { approvalGateNode } from "./nodes/approval-gate.js";
import { advanceNode, routeAfterAdvance } from "./nodes/advance.js";
import { assistNode } from "./nodes/assist.js";
import { awaitInputNode } from "./nodes/await-input.js";
import { feedbackNode, routeAfterFeedback } from "./nodes/feedback.js";
import { generateMcqNode } from "./nodes/generate-mcq.js";
import { gradeNode } from "./nodes/grade.js";
import { planNode } from "./nodes/plan.js";
import { summarizeNode } from "./nodes/summarize.js";
import { EdPathStateAnnotation, type GraphState } from "./state/annotation.js";

/** LangGraph node names — must not collide with state channel keys. */
const N1_PLAN = "plan_lesson";
const N7_FEEDBACK = "assemble_feedback";

function routeAfterApproval(state: GraphState): typeof N1_PLAN | "generate_mcq" {
  if (state.approval?.decision === "changes") {
    return N1_PLAN;
  }
  return "generate_mcq";
}

function routeAfterPlan(state: GraphState): "approval_gate" | typeof END {
  if (state.plan && state.lastError === null) {
    return "approval_gate";
  }
  return END;
}

function routeAfterGenerateMcq(state: GraphState): "await_input" | typeof END {
  if (state.questions.length > 0 && state.lastError === null) {
    return "await_input";
  }
  return END;
}

function routeAfterAwaitInput(state: GraphState): "assist" | "grade" {
  if (state.pendingResumeKind === "help") {
    return "assist";
  }
  return "grade";
}

function routeAfterGrade(
  state: GraphState,
): typeof N7_FEEDBACK | "await_input" {
  if (state.lastError?.node === "grade" && state.lastError.kind === "grading") {
    return "await_input";
  }
  return N7_FEEDBACK;
}

function createEdPathWorkflow() {
  return new StateGraph(EdPathStateAnnotation)
    .addNode(N1_PLAN, planNode)
    .addNode("approval_gate", approvalGateNode)
    .addNode("generate_mcq", generateMcqNode)
    .addNode("await_input", awaitInputNode)
    .addNode("assist", assistNode)
    .addNode("grade", gradeNode)
    .addNode(N7_FEEDBACK, feedbackNode)
    .addNode("advance", advanceNode)
    .addNode("summarize", summarizeNode)
    .addEdge(START, N1_PLAN)
    .addConditionalEdges(N1_PLAN, routeAfterPlan, {
      approval_gate: "approval_gate",
      [END]: END,
    })
    .addConditionalEdges("approval_gate", routeAfterApproval, {
      [N1_PLAN]: N1_PLAN,
      generate_mcq: "generate_mcq",
    })
    .addConditionalEdges("generate_mcq", routeAfterGenerateMcq, {
      await_input: "await_input",
      [END]: END,
    })
    .addConditionalEdges("await_input", routeAfterAwaitInput, {
      assist: "assist",
      grade: "grade",
    })
    .addEdge("assist", "await_input")
    .addConditionalEdges("grade", routeAfterGrade, {
      [N7_FEEDBACK]: N7_FEEDBACK,
      await_input: "await_input",
    })
    .addConditionalEdges(N7_FEEDBACK, routeAfterFeedback, {
      await_input: "await_input",
      advance: "advance",
    })
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
  return createEdPathWorkflow().compile({
    checkpointer: new MemorySaver(),
  });
}

export const graph = createEdPathGraph();

export { createEdPathWorkflow, N1_PLAN, N7_FEEDBACK };
