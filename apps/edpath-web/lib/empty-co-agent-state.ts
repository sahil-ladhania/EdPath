import type { CoAgentState } from "@repo/types";

/** Mirrors backend seed ([build-initial-state.ts]) — no mock plan or questions. */
export function getEmptyCoAgentState(): CoAgentState {
  return {
    pdfMeta: {
      filename: "",
      pageCount: 0,
      charCount: 0,
    },
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
    phase: "planning",
    lastError: null,
  };
}
