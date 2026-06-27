import { z } from "zod";

/**
 * Per-answer feedback assembled in N7 from the validated MCQ + grade
 * (Gate 5 C — not a fresh LLM artifact). Discriminated on `verdict` so that
 * `explanation` is STRUCTURALLY absent on an incorrect answer: the firewall is
 * what the shape can carry, not prompt-hope. No variant ever carries
 * `correctIndex` — it must never reach the CoAgent mirror. On a correct answer
 * `highlightIndex` IS the correct option (the user picked it), so the widget
 * highlights green from `highlightIndex` alone.
 */
const CorrectFeedbackSchema = z.object({
  verdict: z.literal("correct"),
  highlightIndex: z.number().int().nonnegative(), // submitted (== correct) option → green
  explanation: z.string().min(1),
  canRetry: z.literal(false),
});

const IncorrectFeedbackSchema = z.object({
  verdict: z.literal("incorrect"),
  highlightIndex: z.number().int().nonnegative(), // submitted option → red
  hint: z.string().min(1),
  canRetry: z.literal(true),
});

const ExhaustedFeedbackSchema = z.object({
  verdict: z.literal("exhausted"),
  highlightIndex: z.number().int().nonnegative(), // final submitted option → red
  explanation: z.string().min(1), // teaches at max attempts without revealing correctIndex
  canRetry: z.literal(false),
});

export const FeedbackSchema = z.discriminatedUnion("verdict", [
  CorrectFeedbackSchema,
  IncorrectFeedbackSchema,
  ExhaustedFeedbackSchema,
]);
export type Feedback = z.infer<typeof FeedbackSchema>;
