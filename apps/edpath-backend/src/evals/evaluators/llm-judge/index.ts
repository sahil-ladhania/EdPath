/**
 * LLM-as-judge evaluators — soft 0.8 threshold; no-op without OPENAI_API_KEY.
 */
import { z } from "zod";

import { getLlmClient } from "../../../agent/lib/llm/client.js";
import { isOpenAiConfigured } from "../../../config/env.js";
import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult } from "../../types.js";

const JUDGE_PASS_THRESHOLD = 0.8;

const JudgeScoreSchema = z.object({
  score: z.number().min(0).max(1),
  rationale: z.string(),
});

const JUDGE_SYSTEM_PROMPT = `You are an evaluation judge for an educational AI agent.
Score the given artifact against the rubric on a 0–1 scale.
Return ONLY valid JSON: {"score": number, "rationale": string}`;

async function invokeJudge(
  userPrompt: string,
  checkName: string,
): Promise<EvalCheckResult> {
  if (!isOpenAiConfigured()) {
    return {
      name: checkName,
      passed: true,
      message: "LLM judge skipped (OPENAI_API_KEY not configured)",
    };
  }

  try {
    const client = getLlmClient();
    const result = await client.invoke(JUDGE_SYSTEM_PROMPT, userPrompt, undefined, {
      jsonMode: true,
    });
    const parsed = JudgeScoreSchema.safeParse(JSON.parse(result.text));

    if (!parsed.success) {
      return {
        name: checkName,
        passed: false,
        message: `Judge returned invalid JSON: ${parsed.error.message}`,
      };
    }

    return {
      name: checkName,
      passed: parsed.data.score >= JUDGE_PASS_THRESHOLD,
      message: `score=${parsed.data.score}: ${parsed.data.rationale}`,
    };
  } catch (error) {
    return {
      name: checkName,
      passed: false,
      message: error instanceof Error ? error.message : "Judge invocation failed",
    };
  }
}

export async function evaluatePlanGroundingJudge(
  state: GraphState,
): Promise<EvalCheckResult> {
  if (!state.plan) {
    return {
      name: "llm_plan_grounding",
      passed: false,
      message: "No plan to judge",
    };
  }

  const objectives = state.plan.objectives
    .map((o) => `- ${o.title}: ${o.description}`)
    .join("\n");

  return invokeJudge(
    `RUBRIC: Every objective must be supported by the PDF text. No invented topics.\n\nPDF TEXT:\n${state.pdfText}\n\nPLAN OBJECTIVES:\n${objectives}\n\nScore 0–1.`,
    "llm_plan_grounding",
  );
}

export async function evaluateMcqGroundingJudge(
  state: GraphState,
): Promise<EvalCheckResult[]> {
  const checks: EvalCheckResult[] = [];

  for (const mcq of state.questions) {
    const check = await invokeJudge(
      `RUBRIC: The MCQ must be answerable solely from the PDF text, not general knowledge.\n\nPDF TEXT:\n${state.pdfText}\n\nQUESTION: ${mcq.question}\nOPTIONS:\n${mcq.options.map((o, i) => `${i}. ${o}`).join("\n")}\n\nScore 0–1.`,
      `llm_mcq_grounding_${mcq.questionId}`,
    );
    checks.push(check);
  }

  return checks;
}

export async function evaluateAssistLeakageJudge(
  state: GraphState,
  runResult?: { assistTurns: Array<{ userMessage: string; assistantMessage: string; mcq: GraphState["questions"][number] }> },
): Promise<EvalCheckResult> {
  const mcq = state.questions[state.currentQuestionIndex];
  const turns = runResult?.assistTurns ?? [];

  const transcript =
    turns.length > 0
      ? turns
          .map(
            (t) =>
              `user: ${t.userMessage}\nassistant: ${t.assistantMessage}\nQUESTION: ${t.mcq.question}`,
          )
          .join("\n---\n")
      : state.helpThread.map((m) => `${m.role}: ${m.content}`).join("\n");

  const questionMcq = turns[0]?.mcq ?? mcq;
  if (!questionMcq) {
    return {
      name: "llm_assist_leakage",
      passed: true,
      message: "No active MCQ for assist judge",
    };
  }

  const transcriptBody = transcript || "(empty)";

  return invokeJudge(
    `RUBRIC: The assistant must NOT reveal or eliminate the correct answer. It should steer back to the question.\n\nQUESTION: ${questionMcq.question}\nOPTIONS (correct index hidden):\n${questionMcq.options.map((o, i) => `${i}. ${o}`).join("\n")}\n\nHELP TRANSCRIPT:\n${transcriptBody}\n\nScore 1.0 if no leakage and steered back; 0.0 if answer revealed.`,
    "llm_assist_leakage",
  );
}

export async function evaluateSummaryQualityJudge(
  state: GraphState,
): Promise<EvalCheckResult> {
  if (!state.summary) {
    return {
      name: "llm_summary_quality",
      passed: false,
      message: "No summary to judge",
    };
  }

  const weakObjectives = state.summary.perObjective
    .filter((o) => o.firstTryRate < 1)
    .map((o) => o.title);

  return invokeJudge(
    `RUBRIC: Study tips should be grounded in weak objectives from the PDF. Score 1.0 if tips are relevant and grounded; lower if generic.\n\nPDF TEXT:\n${state.pdfText.slice(0, 2000)}\n\nWEAK OBJECTIVES: ${weakObjectives.join(", ") || "none"}\n\nSTUDY TIPS:\n${state.summary.studyTips.join("\n")}\n\nScore 0–1.`,
    "llm_summary_quality",
  );
}

export { JUDGE_PASS_THRESHOLD };
