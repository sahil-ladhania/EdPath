// MAX_ATTEMPTS and MAX_HELP are shared quiz-loop contract values: defined once
// in @repo/schemas and re-exported here so existing relative imports keep their
// path while the web UI reads the same source.
export { MAX_ATTEMPTS, MAX_HELP } from "@repo/schemas/constants";

/** MCQs generated per objective (B1). */
export const MCQS_PER_OBJECTIVE = 3;

/** Max objectives in a plan (B4). */
export const MAX_OBJECTIVES = 8;

/** Bounded repair retries per generative node (B5). */
export const MAX_REPAIR = 2;

/** Per-run aggregate token ceiling (B7). */
export const TOKEN_CEILING = 1_500_000;

/** Per-node token caps (B7). */
export const MAX_INPUT_TOKENS = 100_000;
export const MAX_OUTPUT_TOKENS = 8_000;
