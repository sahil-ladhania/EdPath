import type { PdfMeta } from "@repo/types";

import type { InitialEdPathStateSeed } from "./upload.types.js";

/** Builds the graph initial-state seed from a successful upload (future start-lesson step). */
export function buildInitialEdPathState(input: {
  pdfText: string;
  pdfMeta: PdfMeta;
}): InitialEdPathStateSeed {
  return {
    pdfText: input.pdfText,
    pdfMeta: input.pdfMeta,
    plan: null,
    approval: null,
    currentObjectiveIndex: 0,
    questions: [],
    currentQuestionIndex: 0,
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    helpThread: [],
    feedback: null,
    results: [],
    score: {
      correct: 0,
      total: 0,
      firstTry: 0,
    },
    summary: null,
    messages: [],
    phase: "planning",
    lastError: null,
  };
}
