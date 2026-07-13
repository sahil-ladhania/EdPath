/*
  * State types for the backend graph.
*/
import type { PdfMeta, LessonPlan, ApprovalDecision, Feedback, MCQ, PublicMCQ, ObjectiveResult, Score, Summary, LastError } from "@repo/schemas";
import type { Phase } from "./phase.js";

// Define the help thread message interface
export interface HelpThreadMessage {
  role: "user" | "assistant";
  content: string;
};

// Define the ed path state interface
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
};

// Define the co agent state interface
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
};