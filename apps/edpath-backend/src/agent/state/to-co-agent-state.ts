/**
 * CoAgent mirror — redacts full checkpoint state for the browser wire.
 * Strips firewalled MCQ fields; runs assertCoAgentFirewall before emit.
**/
import type { CoAgentState, EdPathState, MCQ, PublicMCQ } from "@repo/types";

// Define the function to strip firewalled mcq fields for the browser mirror
export function toPublicMcq(mcq: MCQ): PublicMCQ {
  return {
    questionId: mcq.questionId,
    objectiveId: mcq.objectiveId,
    question: mcq.question,
    options: mcq.options,
  };
};

// Define the function to map full checkpoint state to the redacted co-agent mirror
export function toCoAgentState(state: EdPathState): CoAgentState {
  // Map the full checkpoint state to the redacted co-agent mirror
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

  // Assert the co-agent mirror contains no firewalled keys
  assertCoAgentFirewall(mirror);

  // Return the co-agent mirror
  return mirror;
};

// Define the function to assert the co-agent mirror json contains no firewalled keys
export function assertCoAgentFirewall(snapshot: CoAgentState): void {
  // Stringify the co-agent mirror
  const json = JSON.stringify(snapshot);

  // Define the forbidden keys
  const forbidden = ["correctIndex", "sourceQuote", "pdfText"] as const;

  // Iterate over the forbidden keys
  for (const key of forbidden) {
    // Check if the key is included in the stringified co-agent mirror
    if (json.includes(`"${key}"`)) {
      throw new Error(`CoAgent firewall violation: "${key}" found in mirror`);
    };
  };
};