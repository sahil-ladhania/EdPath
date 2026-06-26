import { Annotation } from "@langchain/langgraph";
import type { CoAgentState } from "@repo/types";

/**
 * CopilotKit / AG-UI output schema — only the redacted mirror crosses the wire.
 * Full EdPathState (pdfText, MCQ[], routing) stays internal to EdPathStateAnnotation.
 */
export const CoAgentStateOutputAnnotation = Annotation.Root({
  coAgentSnapshot: Annotation<CoAgentState>(),
});
