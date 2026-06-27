// Shared Zod schemas — the SINGLE source of truth for every runtime contract
// (artifacts, resume payloads, boundary + scoring shapes). Types are inferred
// here via z.infer and re-exported as the type surface by @repo/types.
// Imported by both edpath-web and edpath-backend.
//
// DAG: @repo/types → @repo/schemas → zod (one direction only; schemas never
// imports from @repo/types).
export * from "./primitives.js";
export * from "./lesson-plan.js";
export * from "./mcq.js";
export * from "./feedback.js";
export * from "./summary.js";
export * from "./resume.js";
export * from "./upload.js";
export * from "./error.js";
export * from "./scoring.js";
export * from "./constants.js";
