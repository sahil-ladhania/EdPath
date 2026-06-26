// Shared TypeScript types for EdPath — the single type-import surface for both
// edpath-web and edpath-backend.
//
// Ownership (see docs/decisions, Stage 0):
//   - Runtime contracts (anything Zod-validated at the backend boundary, anything
//     that crosses the wire, anything the LLM returns) are defined ONCE as Zod
//     schemas in @repo/schemas; their TS types are `z.infer`'d there and
//     re-exported from here. This file never re-declares those shapes.
//   - Pure compile-time types (unions/literals never validated on their own) are
//     defined directly in this package.
//
// Validators (the Zod schema VALUES) are imported from @repo/schemas directly,
// only at the backend boundary. DAG: @repo/types → @repo/schemas → zod.

// --- Inferred runtime-contract types (single-defined as Zod in @repo/schemas) ---
export type {
  // primitives
  Difficulty,
  Verdict,
  // lesson plan
  Objective,
  LessonPlan,
  // mcq (full = server/agent-side; public = redacted web mirror)
  MCQ,
  McqBatch,
  PublicMCQ,
  // feedback
  Feedback,
  // summary
  PerObjectiveStat,
  OverallStat,
  Summary,
  // resume payloads
  ApprovalDecision,
  AnswerSubmission,
  HelpMessage,
  ResumePayload,
  // upload boundary
  PdfMeta,
  UploadRejectReason,
  UploadResult,
  // error surface
  ErrorNode,
  ErrorKind,
  LastError,
  // scoring
  ObjectiveResult,
  Score,
} from "@repo/schemas";

// --- Pure compile-time types (defined in this package) ---
export type { Phase } from "./phase.js";
export type { ObjectiveId, QuestionId } from "./ids.js";
export type { EdPathState, CoAgentState } from "./state.js";
