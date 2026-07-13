/**
 * Graph wiring — nodes + conditional edges; control flow is deterministic.
 * Compiles the Plan → Approve → Quiz → Summarize workflow. 
 * Routing fns (routeAfter*) live here; the LLM never chooses the next step.
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

// Define the function to route after approval
function routeAfterApproval( state: GraphState ): "plan_lesson" | "generate_mcq" {
  // Check if the approval decision is changes
  if (state.approval?.decision === "changes") {
    // Return the plan lesson node
    return "plan_lesson";
  };

  // Return the generate mcq node
  return "generate_mcq";
};

// Define the function to route after plan
function routeAfterPlan(state: GraphState): "approval_gate" | typeof END {
  // Check if the plan is present and there is no last error
  if (state.plan && state.lastError === null) {
    // Return the approval gate node
    return "approval_gate";
  };

  // Return the end node
  return END;
};

// Define the function to route after generate mcq
export function routeAfterGenerateMcq( state: GraphState ): "await_input" | "generate_mcq" {
  // Check if the questions are present and there is no last error
  if (state.questions.length > 0 && state.lastError === null) {
    // Return the await input node
    return "await_input";
  };

  // Check if the last error is the generate mcq node and the mcq gen attempts are less than the max repair
  if ( state.lastError?.node === "generate_mcq" && state.mcqGenAttempts <= MAX_REPAIR ) {
    // Return the generate mcq node
    return "generate_mcq";
  };

  // Return the await input node
  return "await_input";
};

// Define the function to route after await input
export function routeAfterAwaitInput( state: GraphState ): "assist" | "grade" | "advance" | "generate_mcq" {
  // Check if the pending resume kind is help
  if (state.pendingResumeKind === "help") {
    // Return the assist node
    return "assist";
  };

  // Check if the pending resume kind is advance
  if (state.pendingResumeKind === "advance") {
    // Return the advance node
    return "advance";
  };

  // Check if the pending resume kind is retry
  if (state.pendingResumeKind === "retry") {
    // Return the generate mcq node
    return "generate_mcq";
  };

  // Return the grade node
  return "grade";
};

// Define the function to route after grade
function routeAfterGrade( state: GraphState ): "assemble_feedback" | "await_input" {
  // Check if the last error is the grade node and the last error kind is grading
  if (state.lastError?.node === "grade" && state.lastError.kind === "grading") {
    // Return the await input node
    return "await_input";
  };

  // Return the assemble feedback node
  return "assemble_feedback";
};

// Define the function to create the ed path workflow
function createEdPathWorkflow() {
  // Return the state graph
  return new StateGraph(EdPathStateAnnotation, {
    // Set the output to the co agent state output annotation
    output: CoAgentStateOutputAnnotation,
  })
    // Add the plan lesson node
    .addNode("plan_lesson", planNode) 
    // Add the approval gate node
    .addNode("approval_gate", approvalGateNode)
    // Add the generate mcq node
    .addNode("generate_mcq", generateMcqNode)
    // Add the await input node
    .addNode("await_input", awaitInputNode)
    // Add the assist node
    .addNode("assist", assistNode)
    // Add the grade node
    .addNode("grade", gradeNode)
    // Add the assemble feedback node
    .addNode("assemble_feedback", feedbackNode)
    // Add the advance node
    .addNode("advance", advanceNode)
    // Add the summarize node
    .addNode("summarize", summarizeNode)
    // Add the edge from the start to the plan lesson node
    .addEdge(START, "plan_lesson")
    // Add the conditional edges from the plan lesson node
    .addConditionalEdges("plan_lesson", routeAfterPlan, {
      approval_gate: "approval_gate",
      [END]: END,
    })
    // Add the conditional edges from the approval gate node
    .addConditionalEdges("approval_gate", routeAfterApproval, {
      plan_lesson: "plan_lesson",
      generate_mcq: "generate_mcq",
    })
    // Add the conditional edges from the generate mcq node
    .addConditionalEdges("generate_mcq", routeAfterGenerateMcq, {
      await_input: "await_input",
      generate_mcq: "generate_mcq",
    })
    // Add the conditional edges from the await input node
    .addConditionalEdges("await_input", routeAfterAwaitInput, {
      assist: "assist",
      grade: "grade",
      advance: "advance",
      generate_mcq: "generate_mcq",
    })
    // Add the edge from the assist node to the await input node
    .addEdge("assist", "await_input")
    // Add the conditional edges from the grade node
    .addConditionalEdges("grade", routeAfterGrade, {
      assemble_feedback: "assemble_feedback",
      await_input: "await_input",
    })
    // Add the edge from the assemble feedback node to the await input node
    .addEdge("assemble_feedback", "await_input")
    // Add the conditional edges from the advance node
    .addConditionalEdges("advance", routeAfterAdvance, {
      await_input: "await_input",
      generate_mcq: "generate_mcq",
      summarize: "summarize",
    })
    // Add the edge from the summarize node to the end node
    .addEdge("summarize", END);
};

// Define the function to create the ed path graph
export function createEdPathGraph(): ReturnType<ReturnType<typeof createEdPathWorkflow>["compile"]> {
  // Return the compiled graph
  return createEdPathWorkflow().compile({
    checkpointer: new MemorySaver(),
  });
};

// Define the graph
export const graph = createEdPathGraph();

// Export the create edpath workflow function
export { createEdPathWorkflow };