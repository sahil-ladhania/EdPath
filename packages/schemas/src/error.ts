import { z } from "zod";

/** Graph node where a failure surfaced (§5.2 node names). */
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
export type ErrorNode = z.infer<typeof ErrorNodeSchema>;

/** Failure class, derived from the Gate 6 failure-point table. */
export const ErrorKindSchema = z.enum([
  "schema_drift", // invalid JSON / schema validation failed (N1, N3, N5, N9)
  "ungrounded", // sourceQuote failed the deterministic source-anchor check (N3)
  "grading", // GradingError: selectedIndex out of range (N6)
  "token_ceiling", // per-run aggregate token ceiling tripped
]);
export type ErrorKind = z.infer<typeof ErrorKindSchema>;

/** Reliability / recovery surface (§5.1 `lastError`). */
export const LastErrorSchema = z.object({
  node: ErrorNodeSchema,
  kind: ErrorKindSchema,
  detail: z.string(),
});
export type LastError = z.infer<typeof LastErrorSchema>;
