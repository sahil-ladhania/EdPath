/**
  * Score derivation from canonical results[] (D5/D10).
**/
import type { ObjectiveResult, Score } from "@repo/types";

// Define the function to derive a retry-aware score from canonical results
export function deriveScore(results: ObjectiveResult[]): Score {
  return {
    correct: results.filter((r) => r.correct).length,
    total: results.length,
    firstTry: results.filter((r) => r.firstTryCorrect).length,
  };
};