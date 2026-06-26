import { z } from "zod";

/**
 * Full MCQ artifact (Gate 5 B; §5.1 `questions`). SERVER / AGENT-SIDE ONLY.
 * `correctIndex`, `explanation`, `hint`, and `sourceQuote` sit behind the
 * assist firewall and must never reach the browser — the web mirror uses
 * PublicMCQSchema instead.
 */
const MCQObject = z.object({
  questionId: z.string().min(1),
  objectiveId: z.string().min(1), // traces back to the plan
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4), // F4.2: exactly 4; the widget renders four radios
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().min(1), // shown on correct (AC6)
  hint: z.string().min(1), // shown on incorrect (AC7), no answer reveal
  sourceQuote: z.string().min(1), // D4 grounding evidence; backend-only
});

export const MCQSchema = MCQObject.refine(
  (m) => m.correctIndex < m.options.length,
  { message: "correctIndex must index into options", path: ["correctIndex"] },
).refine((m) => new Set(m.options).size === m.options.length, {
  message: "options must be unique",
  path: ["options"],
});
export type MCQ = z.infer<typeof MCQSchema>;

/** LLM batch output for N3 generate_mcq (F4.1: exactly 3 MCQs per objective). */
export const McqBatchSchema = z.object({
  questions: z.array(MCQSchema).length(3),
});
export type McqBatch = z.infer<typeof McqBatchSchema>;

/**
 * Redacted MCQ for the web mirror (Flag 2 — the structural firewall).
 * Omits the four firewalled fields so the answer cannot physically reach the
 * browser: there is no `correctIndex`, `explanation`, `hint`, or `sourceQuote`.
 */
export const PublicMCQSchema = MCQObject.omit({
  correctIndex: true,
  explanation: true,
  hint: true,
  sourceQuote: true,
});
export type PublicMCQ = z.infer<typeof PublicMCQSchema>;
