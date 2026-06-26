import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import type { CoAgentState } from "@repo/types";
import type { StreamMode } from "@langchain/langgraph-sdk";
import type { ThreadState } from "@langchain/langgraph-sdk";

type RunAgentExtendedInput = Parameters<LangGraphAgent["prepareStream"]>[0];

/**
 * EdPath LangGraph bridge:
 * - Fix 1: merge checkpoint values before CopilotKit run input (preserves /start seed).
 * - Fix 2: emit redacted coAgentSnapshot as STATE_SNAPSHOT (firewalled PublicMCQ mirror).
 */
export class EdPathLangGraphAgent extends LangGraphAgent {
  async prepareStream(
    input: RunAgentExtendedInput,
    streamMode: StreamMode | StreamMode[],
  ): Promise<Awaited<ReturnType<LangGraphAgent["prepareStream"]>>> {
    const threadId = input.threadId;

    if (threadId) {
      try {
        const threadState = await this.client.threads.getState(threadId);
        const checkpointValues = (threadState.values ?? {}) as Record<string, unknown>;
        const clientState = (input.state ?? {}) as Record<string, unknown>;

        input = {
          ...input,
          // Checkpoint wins on overlap so empty CopilotKit bootstrap cannot wipe pdfText.
          state: {
            ...clientState,
            ...checkpointValues,
          },
        };
      } catch {
        // Thread may not exist yet — default prepareStream handles creation.
      }
    }

    return super.prepareStream(input, streamMode);
  }

  getStateSnapshot(threadState: ThreadState): CoAgentState {
    const values = threadState.values as Record<string, unknown> | undefined;
    const mirror = values?.coAgentSnapshot;

    if (mirror && typeof mirror === "object" && !Array.isArray(mirror)) {
      return mirror as CoAgentState;
    }

    return super.getStateSnapshot(threadState) as CoAgentState;
  }
}
