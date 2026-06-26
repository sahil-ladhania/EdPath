import { MCQSchema } from "@repo/schemas";
import type { MCQ } from "@repo/types";

import { isOpenAiConfigured } from "../../config/env.js";
import { createStubMcqs } from "../__fixtures__/stubs.js";
import { isSourceAnchored } from "../lib/source-anchor.js";
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

function parseMcqBatch(raw: unknown): MCQ[] | null {
  if (!Array.isArray(raw) || raw.length !== MCQS_PER_OBJECTIVE) {
    return null;
  }

  const mcqs: MCQ[] = [];
  for (const item of raw) {
    const parsed = MCQSchema.safeParse(item);
    if (!parsed.success) {
      return null;
    }
    mcqs.push(parsed.data);
  }

  return mcqs;
}

const McqBatchParser = {
  safeParse(input: unknown) {
    const data = parseMcqBatch(input);
    if (!data) {
      return {
        success: false as const,
        error: { message: `Expected array of ${MCQS_PER_OBJECTIVE} valid MCQs` },
      };
    }
    return { success: true as const, data };
  },
};

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
      feedback: null,
      lastError: null,
    });
  }

  const userPrompt = `PDF TEXT:\n${state.pdfText}\n\nOBJECTIVE:\n${JSON.stringify(objective, null, 2)}\n\nGenerate exactly ${MCQS_PER_OBJECTIVE} MCQs for this objective. Set objectiveId to "${objective.objectiveId}".`;

  const result = await structuredGenerate({
    node: "generate_mcq",
    systemPrompt: MCQ_SYSTEM_PROMPT,
    userPrompt,
    schema: McqBatchParser,
    tokensUsed: state.tokensUsed,
  });

  if (!result.ok) {
    return withCoAgentSnapshot(state, {
      phase: "quizzing",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
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
    feedback: null,
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
  });
}
