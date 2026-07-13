/**
  * Test helpers for the edpath agent.
**/
import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";
import { FIXTURE_PDF_META, FIXTURE_PDF_TEXT } from "./__fixtures__/pdf-text.js";
import { seedGraphState } from "./state/graph-update.js";

// Define the test thread id
export const EDPATH_TEST_THREAD_ID = "edpath-agent-test-thread";

// Define the function to create the test graph input
export function createTestGraphInput() {
  // Return the seed graph state
  return seedGraphState(
    // Build the initial edpath state
    buildInitialEdPathState({
      pdfText: FIXTURE_PDF_TEXT,
      pdfMeta: FIXTURE_PDF_META,
    }),
  );
};