/**
  * Graph update plumbing — merges node patches and refreshes coAgentSnapshot.
**/
import type { EdPathState } from "@repo/types";
import type { AgentMessage } from "../types/message.types.js";
import type { GraphState, GraphUpdate } from "./annotation.js";
import { toCoAgentState } from "./to-co-agent-state.js";

// Define the function to merge a node update and refresh the co-agent mirror
export function withCoAgentSnapshot( state: GraphState, update: GraphUpdate ): GraphUpdate {
  // Merge the state and update
  const merged = { ...state, ...update } as EdPathState;
  
  // Return the merged state with the co-agent snapshot
  return {
    ...update,
    coAgentSnapshot: toCoAgentState(merged),
  };
};

// Define the function to create initial graph state from an ed path state seed
export function seedGraphState(seed: EdPathState): GraphUpdate {
  // Return the initial graph state
  return {
    ...seed,
    messages: seed.messages as AgentMessage[],
    coAgentSnapshot: toCoAgentState(seed),
    pendingResumeKind: null,
    pendingHelpText: null,
    gradeOutput: null,
    tokensUsed: 0,
  };
};