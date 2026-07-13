/*
    * Primitive schemas for the backend graph.
*/
import { z } from "zod";

// Define the difficulty schema
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);

// Define the difficulty type
export type Difficulty = z.infer<typeof DifficultySchema>;

// Define the verdict schema
export const VerdictSchema = z.enum(["correct", "incorrect"]);

// Define the verdict type
export type Verdict = z.infer<typeof VerdictSchema>;