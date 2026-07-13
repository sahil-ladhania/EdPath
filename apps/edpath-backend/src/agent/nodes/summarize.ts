/**
 * Summarize graph node (N9 / summarize).
 * End-of-lesson progress report and study tips. 
 * LLM path with deterministic fallback built from canonical results[] when OpenAI is unavailable.
 */
import { SummarySchema } from "@repo/schemas";
import type { PerObjectiveStat, Summary } from "@repo/types";
import { isOpenAiConfigured } from "../../config/env.js";
import { structuredGenerate } from "../lib/structured-generate.js";
import { SUMMARIZE_SYSTEM_PROMPT } from "../prompts/index.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

// Define the function to build the deterministic summary
function buildDeterministicSummary(state: GraphState): Summary {
  // Get the plan from the state
  const plan = state.plan;

  // Check if the plan is not present
  if (!plan) {
    throw new Error("Plan required for summary");
  };

  // Build the per objective stats
  const perObjective: PerObjectiveStat[] = plan.objectives.map((objective) => {
    // Get the results for the objective
    const objResults = state.results.filter(
      (r) => r.objectiveId === objective.objectiveId,
    );

    // Get the correct results for the objective
    const correct = objResults.filter((r) => r.correct).length;
    
    // Get the total results for the objective
    const total = objResults.length;

    // Get the first try correct results for the objective
    const firstTry = objResults.filter((r) => r.firstTryCorrect).length;

    // Return the per objective stats
    return {
      objectiveId: objective.objectiveId,
      title: objective.title,
      correct,
      total,
      firstTryRate: total > 0 ? firstTry / total : 0,
    };
  });

  // Get the overall correct results
  const overallCorrect = state.results.filter((r) => r.correct).length;

  // Get the overall total results
  const overallTotal = state.results.length;

  // Get the overall first try correct results
  const overallFirstTry = state.results.filter((r) => r.firstTryCorrect).length;

  // Return the deterministic summary
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
};

// Define the function to create the summarize node
export async function summarizeNode( state: GraphState ): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  // Build the deterministic summary
  const deterministic = buildDeterministicSummary(state);

  // Check if the openai is not configured
  if (!isOpenAiConfigured()) {
    // Return the coagent snapshot with the deterministic summary
    return withCoAgentSnapshot(state, {
      summary: SummarySchema.parse(deterministic),
      phase: "complete",
      lastError: null,
    });
  };

  // Get the weak objectives
  const weakObjectives = deterministic.perObjective
    .filter((o) => o.firstTryRate < 1)
    .map((o) => o.title);

  // Build the user prompt
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

  // Generate the summary
  const result = await structuredGenerate<Summary>({
    node: "summarize",
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    userPrompt,
    schema: SummarySchema,
    tokensUsed: state.tokensUsed,
  });

  // Check if the result is not ok
  if (!result.ok) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      summary: SummarySchema.parse(deterministic),
      phase: "complete",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
    });
  };

  // Return the coagent snapshot with the summary
  return withCoAgentSnapshot(state, {
    summary: result.data,
    phase: "complete",
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
  });
};