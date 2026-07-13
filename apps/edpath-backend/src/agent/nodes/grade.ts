/**
 * Grade graph node (N6 / grade).
 * Deterministic answer grader — compares selectedIndex to correctIndex with no LLM involvement. Updates results[] and score; routes to feedback or back to await_input on grading errors.
 */
import { deriveScore } from "../state/derive-score.js";
import { MAX_ATTEMPTS } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import { gradeAnswer, GradingError } from "../lib/grade-answer.js";

// Define the function to create the grade node
export function gradeNode( state: GraphState ): ReturnType<typeof withCoAgentSnapshot> {
  // Get the MCQ from the state
  const mcq = state.questions[state.currentQuestionIndex];

  // Get the selected index from the state
  const selectedIndex = state.selectedIndex;

  // Check if the MCQ or selected index is not present
  if (!mcq || selectedIndex === null) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "grade",
        kind: "grading",
        detail: "Missing question or selectedIndex for grading",
      },
    });
  };

  // Grade the answer
  try {
    const gradeOutput = gradeAnswer({
      selectedIndex,
      mcq,
      priorAttempts: state.attempts,
    });

    // Check if the answer is resolved
    const isResolved = (gradeOutput.verdict === "correct") || (gradeOutput.verdict === "incorrect" && gradeOutput.attempts >= MAX_ATTEMPTS);

    // Get the results from the state
    let results = state.results;

    // Check if the answer is resolved
    if (isResolved) {
      // Build the result
      const result = {
        objectiveId: mcq.objectiveId,
        questionId: mcq.questionId,
        correct: gradeOutput.verdict === "correct",
        attempts: gradeOutput.attempts,
        firstTryCorrect: gradeOutput.firstTryCorrect,
      };

      // Update the results
      results = [...state.results, result];
    };

    // Return the coagent snapshot with the grade output
    return withCoAgentSnapshot(state, {
      attempts: gradeOutput.attempts,
      gradeOutput,
      results,
      score: deriveScore(results),
      pendingResumeKind: null,
      lastError: null,
    });
  } 
  catch (error) {
    // Get the detail of the error
    const detail = error instanceof GradingError ? 
                                                error.message
                                                : 
                                                error instanceof Error ? 
                                                error.message
                                                : 
                                                "Unknown grading error";

    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "grade",
        kind: "grading",
        detail,
      },
      selectedIndex: null,
    });
  };
};