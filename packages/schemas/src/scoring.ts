/*
    * Scoring schemas for the backend graph.
*/
import { z } from "zod";

// Define the objective result schema
export const ObjectiveResultSchema = z.object({
  objectiveId: z.string().min(1),
  questionId: z.string().min(1),
  correct: z.boolean(),
  attempts: z.number().int().nonnegative(),
  firstTryCorrect: z.boolean(),
});

// Define the objective result type
export type ObjectiveResult = z.infer<typeof ObjectiveResultSchema>;

// Define the score schema
export const ScoreSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  firstTry: z.number().int().nonnegative(),
});

// Define the score type
export type Score = z.infer<typeof ScoreSchema>;