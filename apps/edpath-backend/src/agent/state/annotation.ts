/**
 * Graph state schema — EdPathStateAnnotation (single source of state shape).
 * Defines internal channels plus routing fields; CoAgent mirror is separate.
 */
import { Annotation } from "@langchain/langgraph";
import type { ApprovalDecision, CoAgentState, Feedback, LastError, LessonPlan, MCQ, ObjectiveResult, PdfMeta, Score, Summary } from "@repo/types";
import type { AgentMessage } from "../types/message.types.js";
import type { GradeAnswerOutput } from "../types/grade-answer.types.js";
import type { ResumeKind } from "../types/interrupt.types.js";

// Define the ed path state annotation schema
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
  helpThread: Annotation<CoAgentState["helpThread"]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
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
  coAgentSnapshot: Annotation<CoAgentState>(),
  pendingResumeKind: Annotation<ResumeKind | null>(),
  pendingHelpText: Annotation<string | null>(),
  gradeOutput: Annotation<GradeAnswerOutput | null>(),
  tokensUsed: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
  mcqGenAttempts: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
});

// Define the graph state type
export type GraphState = typeof EdPathStateAnnotation.State;

// Define the graph update type
export type GraphUpdate = Partial<GraphState>;