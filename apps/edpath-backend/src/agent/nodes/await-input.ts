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

  return withCoAgentSnapshot(state, {
    pendingResumeKind: "help",
    pendingHelpText: resume.text,
    phase: "awaiting_input",
  });
}
