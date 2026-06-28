/**
 * Deterministic answer grader (N6) — pure function + GradingError.
 *
 * Compares selectedIndex to correctIndex; graph node wraps for state plumbing.
 */
import type {
  GradeAnswerInput,
  GradeAnswerOutput,
} from "../types/grade-answer.types.js";

export class GradingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GradingError";
  }
}

/** Deterministic grader — compares selectedIndex to correctIndex (N6). */
export function gradeAnswer(input: GradeAnswerInput): GradeAnswerOutput {
  const { selectedIndex, mcq, priorAttempts } = input;

  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= mcq.options.length
  ) {
    throw new GradingError(
      `selectedIndex ${selectedIndex} out of range for ${mcq.options.length} options`,
    );
  }

  const attempts = priorAttempts + 1;
  const correct = selectedIndex === mcq.correctIndex;

  return {
    verdict: correct ? "correct" : "incorrect",
    firstTryCorrect: correct && priorAttempts === 0,
    attempts,
  };
}
