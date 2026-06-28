/** Edge-case PDF eval scenarios — minimal and messy document handling. */
import { MESSY_PDF, MINIMAL_PDF } from "../fixtures/pdfs/index.js";
import type { EvalCase } from "../types.js";

export const EDGE_01: EvalCase = {
  id: "EDGE-01",
  tier: "llm",
  category: "edge_pdf",
  pdf: MESSY_PDF,
  description: "Messy PDF — happy path completion",
  dimensions: ["plan_grounded", "mcqs_grounded", "loop_state"],
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const EDGE_02: EvalCase = {
  id: "EDGE-02",
  tier: "llm",
  category: "edge_pdf",
  pdf: MINIMAL_PDF,
  description: "Minimal PDF — happy path completion",
  dimensions: ["plan_grounded", "loop_state"],
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const EDGE_PDF_CASES: EvalCase[] = [EDGE_01, EDGE_02];
