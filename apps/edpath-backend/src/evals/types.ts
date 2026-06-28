/**
 * Eval harness type contracts — dimensions, cases, scripts, run results.
 */
import type { PdfMeta } from "@repo/types";

import type { GraphState } from "../agent/state/annotation.js";
import type { AgentMessage } from "../agent/types/message.types.js";

/** Eval dimensions from agent-architecture Gate 6. */
export type EvalDimension =
  | "plan_grounded"
  | "mcqs_grounded"
  | "feedback_behavior"
  | "loop_state";

export type EvalCategory =
  | "happy"
  | "adversarial_help"
  | "edge_pdf"
  | "resume";

export type EvalTier = "stub" | "llm";

export type ApprovalScript =
  | { decision: "approve" }
  | { decision: "changes"; note: string };

export type EvalScriptStep =
  | { kind: "answer"; selectedIndex: number | "correct" | "wrong" }
  | { kind: "help"; text: string }
  | { kind: "checkpoint"; action: "save" | "resume" }
  | { kind: "approve"; decision: "approve" | "changes"; note?: string };

export interface EvalScript {
  approve?: ApprovalScript;
  steps: EvalScriptStep[];
  /** When true, run until all questions are answered correctly (ignores remaining steps). */
  completeAllCorrect?: boolean;
}

export interface EvalPdfFixture {
  text: string;
  meta: PdfMeta;
}

export interface EvalCase {
  id: string;
  tier: EvalTier;
  category: EvalCategory;
  pdf: EvalPdfFixture;
  script: EvalScript;
  dimensions: EvalDimension[];
  description?: string;
}

export interface ScenarioSnapshot {
  phase: GraphState["phase"];
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  attempts: number;
  resultsLength: number;
  helpTurnsUsed: number;
}

export interface AssistTurnRecord {
  questionId: string;
  userMessage: string;
  assistantMessage: string;
  mcq: GraphState["questions"][number];
}

export interface ScenarioRunResult {
  caseId: string;
  threadId: string;
  finalState: GraphState;
  /** All MCQ batches observed during the run (questions[] is replaced per objective). */
  allGeneratedMcqs: GraphState["questions"];
  helpTranscripts: AgentMessage[][];
  assistTurns: AssistTurnRecord[];
  snapshots: ScenarioSnapshot[];
  checkpointState: GraphState | null;
  tokensUsed: number;
}

export interface EvalCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface DimensionEvalResult {
  dimension: EvalDimension;
  passed: boolean;
  checks: EvalCheckResult[];
}

export interface CaseEvalResult {
  caseId: string;
  passed: boolean;
  dimensions: DimensionEvalResult[];
  error?: string;
}

export interface SuiteEvalResult {
  total: number;
  passed: number;
  failed: number;
  cases: CaseEvalResult[];
}
