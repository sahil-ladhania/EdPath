import { deriveScore } from "../state/derive-score.js";
import { MAX_ATTEMPTS } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import { gradeAnswer, GradingError } from "../lib/grade-answer.js";

export function gradeNode(
  state: GraphState,
): ReturnType<typeof withCoAgentSnapshot> {
  const mcq = state.questions[state.currentQuestionIndex];
  const selectedIndex = state.selectedIndex;

  if (!mcq || selectedIndex === null) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "grade",
        kind: "grading",
        detail: "Missing question or selectedIndex for grading",
      },
    });
  }

  try {
    const gradeOutput = gradeAnswer({
      selectedIndex,
      mcq,
      priorAttempts: state.attempts,
    });

    const isResolved =
      gradeOutput.verdict === "correct" ||
      (gradeOutput.verdict === "incorrect" &&
        gradeOutput.attempts >= MAX_ATTEMPTS);

    let results = state.results;
    if (isResolved) {
      const result = {
        objectiveId: mcq.objectiveId,
        questionId: mcq.questionId,
        correct: gradeOutput.verdict === "correct",
        attempts: gradeOutput.attempts,
        firstTryCorrect: gradeOutput.firstTryCorrect,
      };
      results = [...state.results, result];
    }

    return withCoAgentSnapshot(state, {
      attempts: gradeOutput.attempts,
      gradeOutput,
      results,
      score: deriveScore(results),
      pendingResumeKind: null,
      lastError: null,
    });
  } catch (error) {
    const detail =
      error instanceof GradingError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown grading error";

    return withCoAgentSnapshot(state, {
      lastError: {
        node: "grade",
        kind: "grading",
        detail,
      },
      selectedIndex: null,
    });
  }
}
