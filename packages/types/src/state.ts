import type {
  PdfMeta,
  LessonPlan,
  ApprovalDecision,
  Feedback,
  MCQ,
  PublicMCQ,
  ObjectiveResult,
  Score,
  Summary,
  LastError,
} from "@repo/schemas";
import type { Phase } from "./phase.js";

/** Per-question assist side-channel thread mirrored to the MCQ widget (F8). */
export interface HelpThreadMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The full checkpointed graph state (§5.1) — the single source of truth and the
 * agent's memory. A composed TS type (Flag 1): there is no runtime
 * `EdPathStateSchema`; its constituent artifacts are each Zod-validated at the
 * backend boundary, and the checkpointer owns durability.
 *
 * AGENT / SERVER-SIDE: holds `pdfText` (grounding source) and the full `MCQ`s.
 * The browser never receives this — it mirrors `CoAgentState` instead.
 *
 * `messages` is owned by CopilotKit / LangGraph (excluded from our contracts),
 * so it stays generic: the agent specializes it with the runtime message type
 * (e.g. `EdPathState<BaseMessage>`) without pulling that dependency into
 * @repo/types and breaking the types → schemas → zod DAG.
 */
export interface EdPathState<TMessage = unknown> {
  pdfText: string;
  pdfMeta: PdfMeta;
  plan: LessonPlan | null;
  approval: ApprovalDecision | null;
  currentObjectiveIndex: number;
  questions: MCQ[];
  currentQuestionIndex: number;
  selectedIndex: number | null;
  attempts: number;
  helpTurnsUsed: number;
  helpThread: HelpThreadMessage[];
  feedback: Feedback | null;
  results: ObjectiveResult[];
  score: Score;
  summary: Summary | null;
  messages: TMessage[];
  phase: Phase;
  lastError: LastError | null;
}

/**
 * The redacted state mirrored to the browser via the CoAgent hook (Flag 2).
 * Structurally firewalled: there is NO `pdfText`, and `questions` are
 * `PublicMCQ` — the type literally has no `correctIndex` / `explanation` /
 * `hint` / `sourceQuote` field for the answer to travel through. `messages`
 * flow over CopilotKit's own channel, not this state mirror.
 */
export interface CoAgentState {
  pdfMeta: PdfMeta;
  plan: LessonPlan | null;
  approval: ApprovalDecision | null;
  currentObjectiveIndex: number;
  questions: PublicMCQ[];
  currentQuestionIndex: number;
  selectedIndex: number | null;
  attempts: number;
  helpTurnsUsed: number;
  helpThread: HelpThreadMessage[];
  feedback: Feedback | null;
  results: ObjectiveResult[];
  score: Score;
  summary: Summary | null;
  phase: Phase;
  lastError: LastError | null;
}
