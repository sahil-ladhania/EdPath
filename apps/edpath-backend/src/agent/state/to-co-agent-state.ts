import type { CoAgentState, EdPathState, MCQ, PublicMCQ } from "@repo/types";

/** Strips firewalled MCQ fields for the browser mirror. */
export function toPublicMcq(mcq: MCQ): PublicMCQ {
  return {
    questionId: mcq.questionId,
    objectiveId: mcq.objectiveId,
    question: mcq.question,
    options: mcq.options,
  };
}

/** Maps full checkpoint state to the redacted CoAgent mirror (Flag 2). */
export function toCoAgentState(state: EdPathState): CoAgentState {
  return {
    pdfMeta: state.pdfMeta,
    plan: state.plan,
    approval: state.approval,
    currentObjectiveIndex: state.currentObjectiveIndex,
    questions: state.questions.map(toPublicMcq),
    currentQuestionIndex: state.currentQuestionIndex,
    selectedIndex: state.selectedIndex,
    attempts: state.attempts,
    helpTurnsUsed: state.helpTurnsUsed,
    feedback: state.feedback,
    results: state.results,
    score: state.score,
    summary: state.summary,
    phase: state.phase,
    lastError: state.lastError,
  };
}

/** Asserts the CoAgent mirror JSON contains no firewalled keys. */
export function assertCoAgentFirewall(snapshot: CoAgentState): void {
  const json = JSON.stringify(snapshot);
  const forbidden = ["correctIndex", "sourceQuote", "pdfText"] as const;
  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`CoAgent firewall violation: "${key}" found in mirror`);
    }
  }
}
