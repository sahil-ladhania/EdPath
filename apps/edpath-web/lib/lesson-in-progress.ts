import type { CoAgentState } from "@repo/types";

// Function to check if the lesson is already in progress
export function isLessonAlreadyInProgress(state: CoAgentState): boolean {
  // Return true if the lesson has questions
  if (state.questions.length > 0) {
    return true;
  };

  // Return true if the lesson has a plan and is not in the planning phase
  if (state.plan !== null && state.phase !== "planning") {
    return true;
  };

  // Return true if the lesson is in the awaiting input, awaiting approval, or quizzing phase
  return ( state.phase === "awaiting_input" || state.phase === "awaiting_approval" || state.phase === "quizzing" );
};