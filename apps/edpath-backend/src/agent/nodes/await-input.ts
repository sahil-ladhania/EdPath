/**
 * Await input graph node (N4 / await_input).
 *
 * HITL interrupt — pauses for answer, help, advance, or MCQ retry signal.
 * Parses resume payload and sets pendingResumeKind for graph routing.
 */
import { ResumePayloadSchema } from "@repo/schemas";
import { interrupt } from "@langchain/langgraph";

import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { AwaitInputInterruptPayload } from "../types/interrupt.types.js";

export function awaitInputNode(
  state: GraphState,
): ReturnType<typeof withCoAgentSnapshot> {
  const rawResume = interrupt<AwaitInputInterruptPayload, unknown>({
    type: "await_input",
  });

  const parsed = ResumePayloadSchema.safeParse(rawResume);
  if (!parsed.success) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "await_input",
        kind: "schema_drift",
        detail: parsed.error.message,
      },
      phase: "awaiting_input",
    });
  }

  const resume = parsed.data;

  if (resume.kind === "answer") {
    return withCoAgentSnapshot(state, {
      selectedIndex: resume.selectedIndex,
      pendingResumeKind: "answer",
      pendingHelpText: null,
      feedback: null,
      phase: "awaiting_input",
    });
  }

  if (resume.kind === "advance") {
    // "Next question" after correct/exhausted feedback — hand off to advance.
    // Feedback stays set here; advanceNode clears it as it moves forward.
    return withCoAgentSnapshot(state, {
      pendingResumeKind: "advance",
      pendingHelpText: null,
      phase: "awaiting_input",
    });
  }

  if (resume.kind === "retry") {
    // "Try again" after MCQ generation failed — reset the repair budget and the
    // error, then route back to generate_mcq for a fresh attempt (G8 recovery).
    return withCoAgentSnapshot(state, {
      pendingResumeKind: "retry",
      pendingHelpText: null,
      mcqGenAttempts: 0,
      lastError: null,
      phase: "quizzing",
    });
  }

  return withCoAgentSnapshot(state, {
    pendingResumeKind: "help",
    pendingHelpText: resume.text,
    phase: "awaiting_input",
  });
}
