import type { CoAgentState } from "@repo/types";

/** True when the thread already has an active or resumed lesson checkpoint. */
export function isLessonAlreadyInProgress(state: CoAgentState): boolean {
  if (state.questions.length > 0) {
    return true;
  }

  if (state.plan !== null && state.phase !== "planning") {
    return true;
  }

  return (
    state.phase === "awaiting_input" ||
    state.phase === "awaiting_approval" ||
    state.phase === "quizzing"
  );
}
