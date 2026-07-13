/*
    * Resume payload schemas for the backend graph.
*/
import { z } from "zod";

// Define the approval decision schema
export const ApprovalDecisionSchema = z.object({
  decision: z.enum(["approve", "changes"]),
  note: z.string().min(1).optional(),
});

// Define the approval decision type
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

// Define the answer submission schema
export const AnswerSubmissionSchema = z.object({
  selectedIndex: z.number().int().nonnegative(),
});

// Define the answer submission type
export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

// Define the help message schema
export const HelpMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

// Define the help message type
export type HelpMessage = z.infer<typeof HelpMessageSchema>;

// Define the advance signal schema
export const AdvanceSignalSchema = z.object({});

// Define the advance signal type
export type AdvanceSignal = z.infer<typeof AdvanceSignalSchema>;

// Define the retry signal schema
export const RetrySignalSchema = z.object({});

// Define the retry signal type
export type RetrySignal = z.infer<typeof RetrySignalSchema>;

// Define the resume payload schema
export const ResumePayloadSchema = z.discriminatedUnion("kind", [
  AnswerSubmissionSchema.extend({ kind: z.literal("answer") }),
  HelpMessageSchema.extend({ kind: z.literal("help") }),
  AdvanceSignalSchema.extend({ kind: z.literal("advance") }),
  RetrySignalSchema.extend({ kind: z.literal("retry") }),
]);

// Define the resume payload type
export type ResumePayload = z.infer<typeof ResumePayloadSchema>;