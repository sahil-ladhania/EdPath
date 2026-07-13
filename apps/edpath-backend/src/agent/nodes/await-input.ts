/**
 * Await input graph node (N4 / await_input).
 * HITL interrupt — pauses for answer, help, advance, or MCQ retry signal.
 * Parses resume payload and sets pendingResumeKind for graph routing.
**/
import { ResumePayloadSchema } from "@repo/schemas";
import { interrupt } from "@langchain/langgraph";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { AwaitInputInterruptPayload } from "../types/interrupt.types.js";

// Define the function to create the await input node
export function awaitInputNode( state: GraphState ): ReturnType<typeof withCoAgentSnapshot> {
  // Interrupt for await input
  const rawResume = interrupt<AwaitInputInterruptPayload, unknown>({
    type: "await_input",
  });

  // Parse the resume payload
  const parsed = ResumePayloadSchema.safeParse(rawResume);

  // Check if the resume payload is not valid
  if (!parsed.success) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "await_input",
        kind: "schema_drift",
        detail: parsed.error.message,
      },
      phase: "awaiting_input",
    });
  };

  // Get the resume payload
  const resume = parsed.data;

  // Check if the resume payload is an answer
  if (resume.kind === "answer") {
    // Return the coagent snapshot with the resume payload
    return withCoAgentSnapshot(state, {
      selectedIndex: resume.selectedIndex,
      pendingResumeKind: "answer",
      pendingHelpText: null,
      feedback: null,
      phase: "awaiting_input",
    });
  };

  // Check if the resume payload is an advance
  if (resume.kind === "advance") {
    // Return the coagent snapshot with the resume payload
    return withCoAgentSnapshot(state, {
      pendingResumeKind: "advance",
      pendingHelpText: null,
      phase: "awaiting_input",
    });
  };

  // Check if the resume payload is a retry
  if (resume.kind === "retry") {
    // Return the coagent snapshot with the resume payload
    return withCoAgentSnapshot(state, {
      pendingResumeKind: "retry",
      pendingHelpText: null,
      mcqGenAttempts: 0,
      lastError: null,
      phase: "quizzing",
    });
  };

  // Return the coagent snapshot with the resume payload
  return withCoAgentSnapshot(state, {
    pendingResumeKind: "help",
    pendingHelpText: resume.text,
    phase: "awaiting_input",
  });
};