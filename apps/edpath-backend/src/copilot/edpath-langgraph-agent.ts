/**
 * EdPath LangGraph agent.
 */
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import type { CoAgentState } from "@repo/types";
import type { StreamMode } from "@langchain/langgraph-sdk";
import type { ThreadState } from "@langchain/langgraph-sdk";


// Define the type for the run agent extended input
type RunAgentExtendedInput = Parameters<LangGraphAgent["prepareStream"]>[0];

// Define the EdPath LangGraph agent
export class EdPathLangGraphAgent extends LangGraphAgent {
  // Define the function to prepare the stream
  async prepareStream( input: RunAgentExtendedInput, streamMode: StreamMode | StreamMode[] ): Promise<Awaited<ReturnType<LangGraphAgent["prepareStream"]>>> {
    // Get the thread id from the input
    const threadId = input.threadId;

    // Check if the thread id is present
    if (threadId) {
      try {
        // Get the thread state
        const threadState = await this.client.threads.getState(threadId);

        // Get the checkpoint values from the thread state
        const checkpointValues = (threadState.values ?? {}) as Record<string, unknown>;

        // Get the client state from the input
        const clientState = (input.state ?? {}) as Record<string, unknown>;

        // Build the new input
        input = {
          ...input,
          state: {
            ...clientState,
            ...checkpointValues,
          },
        };
      } 
      catch {
        // Do nothing
        // The thread may not exist yet — default prepareStream handles creation.
      };
    };

    // Return the super prepare stream
    return super.prepareStream(input, streamMode);
  };

  // Define the function to get the state snapshot
  getStateSnapshot(threadState: ThreadState): CoAgentState {
    // Get the values from the thread state
    const values = threadState.values as Record<string, unknown> | undefined;

    // Get the mirror from the values
    const mirror = values?.coAgentSnapshot;

    // Check if the mirror is present and is an object and is not an array
    if (mirror && typeof mirror === "object" && !Array.isArray(mirror)) {
      // Return the mirror as the coagent state
      return mirror as CoAgentState;
    };

    // Return the super state snapshot
    return super.getStateSnapshot(threadState) as CoAgentState;
  };
};