/**
 * Generate MCQ graph node (N3 / generate_mcq).
 *
 * LLM generates MCQs for the current objective; each sourceQuote must pass
 * the source-anchor gate. Failed batches bump mcqGenAttempts against the
 * repair budget before routing retries or surfaces error at await_input.
 */
import type { MCQ } from "@repo/types";

import { isOpenAiConfigured } from "../../config/env.js";
import { createStubMcqs } from "../__fixtures__/stubs.js";
import { isSourceAnchored } from "../lib/source-anchor.js";
import { McqBatchResponseParser } from "../lib/parse-mcq-batch.js";
import { structuredGenerate } from "../lib/structured-generate.js";
import { MCQ_SYSTEM_PROMPT } from "../prompts/index.js";
import { MCQS_PER_OBJECTIVE } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

let useStubMcqs = false;

/** Test hook — skip LLM and return stub MCQs. */
export function setUseStubMcqs(value: boolean): void {
  useStubMcqs = value;
}

export async function generateMcqNode(
  state: GraphState,
): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  const plan = state.plan;
  if (!plan) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "generate_mcq",
        kind: "schema_drift",
        detail: "Plan is required for MCQ generation",
      },
    });
  }

  const objective = plan.objectives[state.currentObjectiveIndex];
  if (!objective) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "generate_mcq",
        kind: "schema_drift",
        detail: "Current objective index out of range",
      },
    });
  }

  if (useStubMcqs || !isOpenAiConfigured()) {
    return withCoAgentSnapshot(state, {
      questions: createStubMcqs(objective.objectiveId),
      phase: "awaiting_input",
      currentQuestionIndex: 0,
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      helpThread: [],
      feedback: null,
      lastError: null,
      mcqGenAttempts: 0,
    });
  }

  const userPrompt = `PDF TEXT:
<pdf_content>
${state.pdfText}
</pdf_content>

OBJECTIVE:
${JSON.stringify(objective, null, 2)}

Generate exactly ${MCQS_PER_OBJECTIVE} MCQs for this objective. Set objectiveId to "${objective.objectiveId}". Return JSON: { "questions": [ ... ] }.`;

  const result = await structuredGenerate<MCQ[]>({
    node: "generate_mcq",
    systemPrompt: MCQ_SYSTEM_PROMPT,
    userPrompt,
    schema: McqBatchResponseParser,
    tokensUsed: state.tokensUsed,
  });

  if (!result.ok) {
    return withCoAgentSnapshot(state, {
      phase: "quizzing",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
      mcqGenAttempts: state.mcqGenAttempts + 1,
    });
  }

  for (const mcq of result.data) {
    if (!isSourceAnchored(mcq.sourceQuote, state.pdfText)) {
      return withCoAgentSnapshot(state, {
        phase: "quizzing",
        lastError: {
          node: "generate_mcq",
          kind: "ungrounded",
          detail: `sourceQuote not found in pdfText for ${mcq.questionId}`,
        },
        tokensUsed: result.tokensUsed - state.tokensUsed,
        mcqGenAttempts: state.mcqGenAttempts + 1,
      });
    }
  }

  return withCoAgentSnapshot(state, {
    questions: result.data,
    phase: "awaiting_input",
    currentQuestionIndex: 0,
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    helpThread: [],
    feedback: null,
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
    mcqGenAttempts: 0,
  });
}
