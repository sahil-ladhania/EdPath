/**
 * CoAgent mirror — redacts full checkpoint state for the browser wire.
 *
 * Strips firewalled MCQ fields; runs assertCoAgentFirewall before emit.
 */
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
  const mirror: CoAgentState = {
    pdfMeta: state.pdfMeta,
    plan: state.plan,
    approval: state.approval,
    currentObjectiveIndex: state.currentObjectiveIndex,
    questions: state.questions.map(toPublicMcq),
    currentQuestionIndex: state.currentQuestionIndex,
    selectedIndex: state.selectedIndex,
    attempts: state.attempts,
    helpTurnsUsed: state.helpTurnsUsed,
    helpThread: state.helpThread,
    feedback: state.feedback,
    results: state.results,
    score: state.score,
    summary: state.summary,
    phase: state.phase,
    lastError: state.lastError,
  };

  // Defense-in-depth: the mirror is already redacted by construction
  // (toPublicMcq strips the firewalled fields), so this guard always passes
  // today. It runs on every emit — toCoAgentState is the single chokepoint for
  // withCoAgentSnapshot, seedGraphState, and the initial state — so a future
  // change that reintroduces a firewalled key fails loud here instead of
  // silently reaching the browser.
  assertCoAgentFirewall(mirror);

  return mirror;
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
