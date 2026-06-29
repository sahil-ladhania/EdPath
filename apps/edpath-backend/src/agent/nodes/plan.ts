/**
 * Plan lesson graph node (N1 / plan_lesson).
 *
 * LLM drafts a PDF-grounded lesson plan via structured-generate; stub path
 * when OpenAI is not configured. On success, routes to approval_gate.
 */
import { LessonPlanSchema } from "@repo/schemas";

import { isOpenAiConfigured } from "../../config/env.js";
import { structuredGenerate } from "../lib/structured-generate.js";
import { getPlanModel } from "../lib/llm/client.js";
import { PLAN_SYSTEM_PROMPT } from "../prompts/index.js";
import {
  assertStubLessonPlan,
  createStubLessonPlan,
} from "../__fixtures__/stubs.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

let useStubPlan = false;

/** Test hook — skip LLM and return stub plan. */
export function setUseStubPlan(value: boolean): void {
  useStubPlan = value;
}

export async function planNode(
  state: GraphState,
): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  if (useStubPlan || !isOpenAiConfigured()) {
    const plan = assertStubLessonPlan(createStubLessonPlan());
    return withCoAgentSnapshot(state, {
      plan,
      phase: "awaiting_approval",
      lastError: null,
    });
  }

  const replanNote =
    state.approval?.decision === "changes" ? state.approval.note : undefined;

  const userPrompt = replanNote
    ? `PDF TEXT:
<pdf_content>
${state.pdfText}
</pdf_content>

User requested changes: ${replanNote}

Generate a revised lesson plan.`
    : `PDF TEXT:
<pdf_content>
${state.pdfText}
</pdf_content>

Generate a lesson plan from this PDF.`;

  const result = await structuredGenerate({
    node: "plan",
    systemPrompt: PLAN_SYSTEM_PROMPT,
    userPrompt,
    schema: LessonPlanSchema,
    getModel: getPlanModel,
    tokensUsed: state.tokensUsed,
  });

  if (!result.ok) {
    return withCoAgentSnapshot(state, {
      phase: "planning",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
    });
  }

  return withCoAgentSnapshot(state, {
    plan: result.data,
    phase: "awaiting_approval",
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
  });
}
