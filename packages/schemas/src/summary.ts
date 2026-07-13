/*
    * Summary schemas for the backend graph.
*/
import { z } from "zod";

// Define the rate schema
const RateSchema = z.number().min(0).max(1);

// Define the per-objective stat schema
export const PerObjectiveStatSchema = z.object({
  objectiveId: z.string().min(1),
  title: z.string().min(1),
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTryRate: RateSchema,
});

// Define the per-objective stat type
export type PerObjectiveStat = z.infer<typeof PerObjectiveStatSchema>;

// Define the overall stat schema
export const OverallStatSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTryRate: RateSchema,
});

// Define the overall stat type
export type OverallStat = z.infer<typeof OverallStatSchema>;

// Define the summary schema
export const SummarySchema = z.object({
  perObjective: z.array(PerObjectiveStatSchema),
  overall: OverallStatSchema,
  studyTips: z.array(z.string().min(1)),
});

// Define the summary type
export type Summary = z.infer<typeof SummarySchema>;