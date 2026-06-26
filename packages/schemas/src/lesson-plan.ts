import { z } from "zod";
import { DifficultySchema } from "./primitives.ts";

/** One ordered learning objective in the plan (Gate 5 A). */
export const ObjectiveSchema = z.object({
  objectiveId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1), // grounded in pdfText
  difficulty: DifficultySchema,
});
export type Objective = z.infer<typeof ObjectiveSchema>;

/** The approved todo list shown at the HITL gate (Gate 5 A; §5.1 `plan`). */
export const LessonPlanSchema = z.object({
  objectives: z.array(ObjectiveSchema).min(1).max(8), // ≤ 8 objectives (B4)
});
export type LessonPlan = z.infer<typeof LessonPlanSchema>;
