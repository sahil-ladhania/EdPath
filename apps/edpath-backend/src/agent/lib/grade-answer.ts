/**
 * Deterministic answer grader (N6) — pure function + GradingError.
 * Compares selectedIndex to correctIndex; graph node wraps for state plumbing.
**/
import type { GradeAnswerInput, GradeAnswerOutput } from "../types/grade-answer.types.js";

// Define the grading error class
export class GradingError extends Error {
  // Define the constructor
  constructor(message: string) {
    super(message);
    this.name = "GradingError";
  };
};

// Define the function to grade the answer
export function gradeAnswer(input: GradeAnswerInput): GradeAnswerOutput {
  // Get the selected index, MCQ, and prior attempts from the input
  const { selectedIndex, mcq, priorAttempts } = input;

  // Check if the selected index is not an integer or is less than 0 or is greater than or equal to the number of options
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= mcq.options.length) {
    throw new GradingError(
      `selectedIndex ${selectedIndex} out of range for ${mcq.options.length} options`,
    );
  };

  // Get the number of attempts
  const attempts = priorAttempts + 1;

  // Check if the selected index is equal to the correct index
  const correct = selectedIndex === mcq.correctIndex;

  // Return the verdict, first try correct, and attempts
  return {
    verdict: correct ? "correct" : "incorrect",
    firstTryCorrect: correct && priorAttempts === 0,
    attempts,
  };
};