import { z } from "zod";

/**
 * N2 approval-gate resume payload (§5.1 `approval`; Part C #5). Equals the
 * non-null form of `state.approval`. On "changes", `note` feeds the N1 re-plan
 * (D6 / D7).
 */
export const ApprovalDecisionSchema = z.object({
  decision: z.enum(["approve", "changes"]),
  note: z.string().min(1).optional(),
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

/**
 * N4 resume payload — a submitted answer (→ grade). Integer index, never free
 * text, so grading can't misparse (Part C #6; Gate 5 ACI rule).
 */
export const AnswerSubmissionSchema = z.object({
  selectedIndex: z.number().int().nonnegative(),
});
export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

/** N4 resume payload — a free-text help request (→ assist) (Part C #7; F8.1). */
export const HelpMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});
export type HelpMessage = z.infer<typeof HelpMessageSchema>;

/**
 * N4 resume payload — an explicit "advance" signal (→ advance). Sent by the
 * "Next question" button after correct/exhausted feedback is shown, so the user
 * controls when the lesson moves on instead of the graph auto-advancing.
 */
export const AdvanceSignalSchema = z.object({});
export type AdvanceSignal = z.infer<typeof AdvanceSignalSchema>;

/**
 * N4 resume payload — a "try again" signal (→ generate_mcq). Sent by the error
 * card's "Try again" button when MCQ generation exhausted its repair budget, so
 * the user can re-run generation instead of being stuck on a dead-end (G8).
 */
export const RetrySignalSchema = z.object({});
export type RetrySignal = z.infer<typeof RetrySignalSchema>;

/**
 * The tagged N4 resume payload. `await_input` branches on `kind` (widget answer
 * vs. free text vs. advance vs. retry) — a deterministic check on the payload's
 * kind, not LLM routing (§5.3 / §5.4). The `kind` tag is reused from the field
 * shapes above so the selectedIndex/text definitions stay single-sourced.
 */
export const ResumePayloadSchema = z.discriminatedUnion("kind", [
  AnswerSubmissionSchema.extend({ kind: z.literal("answer") }),
  HelpMessageSchema.extend({ kind: z.literal("help") }),
  AdvanceSignalSchema.extend({ kind: z.literal("advance") }),
  RetrySignalSchema.extend({ kind: z.literal("retry") }),
]);
export type ResumePayload = z.infer<typeof ResumePayloadSchema>;
