import { z } from "zod";

/** Objective difficulty label — locked to three levels (D17; Gate 5 A). */
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

/** Grade outcome for a submitted answer (Gate 5 B/C). */
export const VerdictSchema = z.enum(["correct", "incorrect"]);
export type Verdict = z.infer<typeof VerdictSchema>;
