import type { ObjectiveResult, Score } from "@repo/types";

/** Derives retry-aware score from canonical results[] (D5/D10). */
export function deriveScore(results: ObjectiveResult[]): Score {
  return {
    correct: results.filter((r) => r.correct).length,
    total: results.length,
    firstTry: results.filter((r) => r.firstTryCorrect).length,
  };
}
