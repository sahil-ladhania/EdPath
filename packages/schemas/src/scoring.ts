import { z } from "zod";

/**
 * Canonical per-question result (§5.1 `results`). `results[]` is the source of
 * truth for scoring; `score` is derived from it and never mutated independently.
 */
export const ObjectiveResultSchema = z.object({
  objectiveId: z.string().min(1),
  questionId: z.string().min(1),
  correct: z.boolean(),
  attempts: z.number().int().nonnegative(),
  firstTryCorrect: z.boolean(), // correct && priorAttempts === 0
});
export type ObjectiveResult = z.infer<typeof ObjectiveResultSchema>;

/** Retry-aware aggregate — a derived projection of `results` (§5.1 `score`). */
export const ScoreSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTry: z.number().int().nonnegative(),
});
export type Score = z.infer<typeof ScoreSchema>;
