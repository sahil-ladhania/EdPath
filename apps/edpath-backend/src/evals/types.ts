/**
 * Eval harness type contracts — dimensions, cases, scripts, run results.
**/
import type { PdfMeta } from "@repo/types";
import type { GraphState } from "../agent/state/annotation.js";
import type { AgentMessage } from "../agent/types/message.types.js";

// Define the eval dimensions
export type EvalDimension = "plan_grounded" | "mcqs_grounded" | "feedback_behavior" | "loop_state";

// Define the eval categories
export type EvalCategory = "happy" | "adversarial_help" | "edge_pdf" | "resume";

// Define the eval tiers
export type EvalTier = "stub" | "llm";

// Define the approval script
export type ApprovalScript = { decision: "approve" } | { decision: "changes"; note: string };

// Define the eval script step
export type EvalScriptStep = { kind: "answer"; selectedIndex: number | "correct" | "wrong" } | { kind: "help"; text: string } | { kind: "checkpoint"; action: "save" | "resume" } | { kind: "approve"; decision: "approve" | "changes"; note?: string };

// Define the eval script
export interface EvalScript {
  approve?: ApprovalScript;
  steps: EvalScriptStep[];
  completeAllCorrect?: boolean;
};

// Define the eval pdf fixture
export interface EvalPdfFixture {
  text: string;
  meta: PdfMeta;
};

// Define the eval case
export interface EvalCase {
  id: string;
  tier: EvalTier;
  category: EvalCategory;
  pdf: EvalPdfFixture;
  script: EvalScript;
  dimensions: EvalDimension[];
  description?: string;
};

// Define the scenario snapshot
export interface ScenarioSnapshot {
  phase: GraphState["phase"];
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  attempts: number;
  resultsLength: number;
  helpTurnsUsed: number;
};

// Define the assist turn record
export interface AssistTurnRecord {
  questionId: string;
  userMessage: string;
  assistantMessage: string;
  mcq: GraphState["questions"][number];
};

// Define the scenario run result
export interface ScenarioRunResult {
  caseId: string;
  threadId: string;
  finalState: GraphState;
  allGeneratedMcqs: GraphState["questions"];
  helpTranscripts: AgentMessage[][];
  assistTurns: AssistTurnRecord[];
  snapshots: ScenarioSnapshot[];
  checkpointState: GraphState | null;
  tokensUsed: number;
};

// Define the eval check result
export interface EvalCheckResult {
  name: string;
  passed: boolean;
  message: string;
};

// Define the dimension eval result
export interface DimensionEvalResult {
  dimension: EvalDimension;
  passed: boolean;
  checks: EvalCheckResult[];
};

// Define the case eval result
export interface CaseEvalResult {
  caseId: string;
  passed: boolean;
  dimensions: DimensionEvalResult[];
  error?: string;
};

// Define the suite eval result   
export interface SuiteEvalResult {
  total: number;
  passed: number;
  failed: number;
  cases: CaseEvalResult[];
};