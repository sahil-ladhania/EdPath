/**
 * Summarize graph node (N9 / summarize).
 *
 * End-of-lesson progress report and study tips. LLM path with deterministic
 * fallback built from canonical results[] when OpenAI is unavailable.
 */
import { SummarySchema } from "@repo/schemas";
import type { PerObjectiveStat, Summary } from "@repo/types";

import { isOpenAiConfigured } from "../../config/env.js";
import { structuredGenerate } from "../lib/structured-generate.js";
import { SUMMARIZE_SYSTEM_PROMPT } from "../prompts/index.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

function buildDeterministicSummary(state: GraphState): Summary {
  const plan = state.plan;
  if (!plan) {
    throw new Error("Plan required for summary");
  }

  const perObjective: PerObjectiveStat[] = plan.objectives.map((objective) => {
    const objResults = state.results.filter(
      (r) => r.objectiveId === objective.objectiveId,
    );
    const correct = objResults.filter((r) => r.correct).length;
    const total = objResults.length;
    const firstTry = objResults.filter((r) => r.firstTryCorrect).length;

    return {
      objectiveId: objective.objectiveId,
      title: objective.title,
      correct,
      total,
      firstTryRate: total > 0 ? firstTry / total : 0,
    };
  });

  const overallCorrect = state.results.filter((r) => r.correct).length;
  const overallTotal = state.results.length;
  const overallFirstTry = state.results.filter((r) => r.firstTryCorrect).length;

  return {
    perObjective,
    overall: {
      correct: overallCorrect,
      total: overallTotal,
      firstTryRate:
        overallTotal > 0 ? overallFirstTry / overallTotal : 0,
    },
    studyTips: [
      "Review the PDF sections linked to objectives where you needed multiple attempts.",
      "Re-read key definitions and try explaining them in your own words.",
    ],
  };
}

export async function summarizeNode(
  state: GraphState,
): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  const deterministic = buildDeterministicSummary(state);

  if (!isOpenAiConfigured()) {
    return withCoAgentSnapshot(state, {
      summary: SummarySchema.parse(deterministic),
      phase: "complete",
      lastError: null,
    });
  }

  const weakObjectives = deterministic.perObjective
    .filter((o) => o.firstTryRate < 1)
    .map((o) => o.title);

  const userPrompt = `PDF TEXT:
<pdf_content>
${state.pdfText}
</pdf_content>

RESULTS:
${JSON.stringify(state.results, null, 2)}

PER OBJECTIVE STATS:
${JSON.stringify(deterministic.perObjective, null, 2)}

Weak objectives: ${weakObjectives.join(", ") || "none"}

Generate a Summary JSON with grounded study tips for weak areas.`;

  const result = await structuredGenerate({
    node: "summarize",
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    userPrompt,
    schema: SummarySchema,
    tokensUsed: state.tokensUsed,
  });

  if (!result.ok) {
    return withCoAgentSnapshot(state, {
      summary: SummarySchema.parse(deterministic),
      phase: "complete",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
    });
  }

  return withCoAgentSnapshot(state, {
    summary: result.data,
    phase: "complete",
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
  });
}
