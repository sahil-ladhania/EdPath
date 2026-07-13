import type { CoAgentState } from "@repo/types";

// Function to get the empty CoAgent state
export function getEmptyCoAgentState(): CoAgentState {
  // Return the empty CoAgent state
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
};