import { Annotation } from "@langchain/langgraph";
import type {
  ApprovalDecision,
  CoAgentState,
  Feedback,
  LastError,
  LessonPlan,
  MCQ,
  ObjectiveResult,
  PdfMeta,
  Score,
  Summary,
} from "@repo/types";

import type { AgentMessage } from "../types/message.types.js";
import type { GradeAnswerOutput } from "../types/grade-answer.types.js";
import type { ResumeKind } from "../types/interrupt.types.js";

/**
 * Full EdPathState channels plus internal routing fields (not in CoAgent mirror).
 * Internal fields are graph-only and stripped by toCoAgentState().
 */
export const EdPathStateAnnotation = Annotation.Root({
  pdfText: Annotation<string>(),
  pdfMeta: Annotation<PdfMeta>(),
  plan: Annotation<LessonPlan | null>(),
  approval: Annotation<ApprovalDecision | null>(),
  currentObjectiveIndex: Annotation<number>(),
  questions: Annotation<MCQ[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  currentQuestionIndex: Annotation<number>(),
  selectedIndex: Annotation<number | null>(),
  attempts: Annotation<number>(),
  helpTurnsUsed: Annotation<number>(),
  feedback: Annotation<Feedback | null>(),
  results: Annotation<ObjectiveResult[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  score: Annotation<Score>(),
  summary: Annotation<Summary | null>(),
  messages: Annotation<AgentMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  phase: Annotation<CoAgentState["phase"]>(),
  lastError: Annotation<LastError | null>(),
  /** Redacted mirror refreshed after each node (CopilotKit boundary). */
  coAgentSnapshot: Annotation<CoAgentState>(),
  /** Internal: last N4 resume kind for conditional routing. */
  pendingResumeKind: Annotation<ResumeKind | null>(),
  /** Internal: help text from N4 resume for N5. */
  pendingHelpText: Annotation<string | null>(),
  /** Internal: N6 output consumed by N7. */
  gradeOutput: Annotation<GradeAnswerOutput | null>(),
  /** Internal: aggregate tokens used this thread (B7). */
  tokensUsed: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
  /** Internal: bounded generate_mcq retries after validation/grounding failure. */
  mcqGenAttempts: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
});

export type GraphState = typeof EdPathStateAnnotation.State;

export type GraphUpdate = Partial<GraphState>;
