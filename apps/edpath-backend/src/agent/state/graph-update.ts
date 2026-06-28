/**
 * Graph update plumbing — merges node patches and refreshes coAgentSnapshot.
 */
import type { EdPathState } from "@repo/types";

import type { AgentMessage } from "../types/message.types.js";
import type { GraphState, GraphUpdate } from "./annotation.js";
import { toCoAgentState } from "./to-co-agent-state.js";

/** Merges a node update and refreshes the CoAgent mirror. */
export function withCoAgentSnapshot(
  state: GraphState,
  update: GraphUpdate,
): GraphUpdate {
  const merged = { ...state, ...update } as EdPathState;
  return {
    ...update,
    coAgentSnapshot: toCoAgentState(merged),
  };
}

/** Creates initial graph state from an EdPathState seed. */
export function seedGraphState(seed: EdPathState): GraphUpdate {
  return {
    ...seed,
    messages: seed.messages as AgentMessage[],
    coAgentSnapshot: toCoAgentState(seed),
    pendingResumeKind: null,
    pendingHelpText: null,
    gradeOutput: null,
    tokensUsed: 0,
  };
}
