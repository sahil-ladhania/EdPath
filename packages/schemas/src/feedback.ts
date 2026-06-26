import { z } from "zod";

/**
 * Per-answer feedback assembled in N7 from the validated MCQ + grade
 * (Gate 5 C — not a fresh LLM artifact). Discriminated on `verdict` so that
 * `correctIndex`/`explanation` are STRUCTURALLY absent on an incorrect answer:
 * the firewall is what the shape can carry, not prompt-hope.
 */
const CorrectFeedbackSchema = z.object({
  verdict: z.literal("correct"),
  highlightIndex: z.number().int().nonnegative(), // submitted option → green
  correctIndex: z.number().int().nonnegative(), // revealed only when correct
  explanation: z.string().min(1),
  canRetry: z.literal(false),
});

const IncorrectFeedbackSchema = z.object({
  verdict: z.literal("incorrect"),
  highlightIndex: z.number().int().nonnegative(), // submitted option → red
  hint: z.string().min(1),
  canRetry: z.boolean(), // true while attempts remain; false at MAX_ATTEMPTS
});

export const FeedbackSchema = z.discriminatedUnion("verdict", [
  CorrectFeedbackSchema,
  IncorrectFeedbackSchema,
]);
export type Feedback = z.infer<typeof FeedbackSchema>;
