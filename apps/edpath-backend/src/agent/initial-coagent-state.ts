import type { CoAgentState } from "@repo/types";

import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";
import { toCoAgentState } from "./state/to-co-agent-state.js";

/** Empty CoAgent mirror for pre-upload / runtime bootstrap. */
export function createInitialCoAgentState(): CoAgentState {
  return toCoAgentState(
    buildInitialEdPathState({
      pdfText: "",
      pdfMeta: { filename: "", charCount: 0, pageCount: 0 },
    }),
  );
}
