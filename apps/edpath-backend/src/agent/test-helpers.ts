import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";

import {
  FIXTURE_PDF_META,
  FIXTURE_PDF_TEXT,
} from "./__fixtures__/pdf-text.js";
import { seedGraphState } from "./state/graph-update.js";

export const EDPATH_TEST_THREAD_ID = "edpath-agent-test-thread";

export function createTestGraphInput() {
  return seedGraphState(
    buildInitialEdPathState({
      pdfText: FIXTURE_PDF_TEXT,
      pdfMeta: FIXTURE_PDF_META,
    }),
  );
}
