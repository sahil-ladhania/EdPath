/*
    * Lesson plan schemas for the backend graph.
*/
import { z } from "zod";
import { DifficultySchema } from "./primitives.js";

// Define the objective schema
export const ObjectiveSchema = z.object({
  objectiveId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: DifficultySchema,
});

// Define the objective type
export type Objective = z.infer<typeof ObjectiveSchema>;

// Define the lesson plan schema
export const LessonPlanSchema = z.object({
  objectives: z.array(ObjectiveSchema).min(1).max(8),
});

// Define the lesson plan type
export type LessonPlan = z.infer<typeof LessonPlanSchema>;