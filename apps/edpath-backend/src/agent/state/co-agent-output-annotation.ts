/*
  * CoAgent output annotation for the backend graph.
*/
import { Annotation } from "@langchain/langgraph";
import type { CoAgentState } from "@repo/types";

// Define the co agent state output annotation schema
export const CoAgentStateOutputAnnotation = Annotation.Root({
  coAgentSnapshot: Annotation<CoAgentState>(),
});