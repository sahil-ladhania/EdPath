/**
  * Initial coagent state for the edpath agent.
**/
import type { CoAgentState } from "@repo/types";
import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";
import { toCoAgentState } from "./state/to-co-agent-state.js";

// Define the function to create the initial coagent state
export function createInitialCoAgentState(): CoAgentState {
  // Return the coagent state
  return toCoAgentState(
    // Build the initial edpath state
    buildInitialEdPathState({
      // Set the pdf text to an empty string
      pdfText: "",
      pdfMeta: { filename: "", charCount: 0, pageCount: 0 },
    }),
  );
};