import { z } from "zod";

const RateSchema = z.number().min(0).max(1); // firstTryRate ∈ [0, 1]

/** Per-objective stats line in the final report (Gate 5 D). */
export const PerObjectiveStatSchema = z.object({
  objectiveId: z.string().min(1),
  title: z.string().min(1),
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTryRate: RateSchema,
});
export type PerObjectiveStat = z.infer<typeof PerObjectiveStatSchema>;

/** Overall stats across the whole lesson (Gate 5 D). */
export const OverallStatSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTryRate: RateSchema,
});
export type OverallStat = z.infer<typeof OverallStatSchema>;

/** Terminal report: per-objective + overall + grounded study tips (§5.1 `summary`). */
export const SummarySchema = z.object({
  perObjective: z.array(PerObjectiveStatSchema),
  overall: OverallStatSchema,
  studyTips: z.array(z.string().min(1)), // personalized, grounded in weak objectives
});
export type Summary = z.infer<typeof SummarySchema>;
