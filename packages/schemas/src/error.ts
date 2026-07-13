/*
  * Error schemas for the backend graph.
*/
import { z } from "zod";

// Define the error node schema
export const ErrorNodeSchema = z.enum([
  "plan",
  "approval_gate",
  "generate_mcq",
  "await_input",
  "assist",
  "grade",
  "feedback",
  "advance",
  "summarize",
]);

// Define the error node type
export type ErrorNode = z.infer<typeof ErrorNodeSchema>;

// Define the error kind schema
export const ErrorKindSchema = z.enum([
  "schema_drift", // invalid JSON / schema validation failed (N1, N3, N5, N9)
  "ungrounded", // sourceQuote failed the deterministic source-anchor check (N3)
  "grading", // GradingError: selectedIndex out of range (N6)
  "token_ceiling", // per-run aggregate token ceiling tripped
]);

// Define the error kind type
export type ErrorKind = z.infer<typeof ErrorKindSchema>;

// Define the last error schema
export const LastErrorSchema = z.object({
  node: ErrorNodeSchema,
  kind: ErrorKindSchema,
  detail: z.string(),
});

// Define the last error type
export type LastError = z.infer<typeof LastErrorSchema>;