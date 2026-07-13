/**
 * Plan lesson graph node (N1 / plan_lesson).
 * LLM drafts a PDF-grounded lesson plan via structured-generate; stub path
 * when OpenAI is not configured. On success, routes to approval_gate.
 */
import { LessonPlanSchema } from "@repo/schemas";
import { isOpenAiConfigured } from "../../config/env.js";
import { structuredGenerate } from "../lib/structured-generate.js";
import { getPlanModel } from "../lib/llm/client.js";
import { PLAN_SYSTEM_PROMPT } from "../prompts/index.js";
import { assertStubLessonPlan, createStubLessonPlan } from "../__fixtures__/stubs.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";

// Define the flag to use the stub plan
let useStubPlan = false;

// Define the function to set the use stub plan flag
export function setUseStubPlan(value: boolean): void {
  useStubPlan = value;
};

// Define the function to create the plan node
export async function planNode( state: GraphState ): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  // Check if the use stub plan flag is set or the openai is not configured
  if (useStubPlan || !isOpenAiConfigured()) {
    // Assert the stub plan
    const plan = assertStubLessonPlan(createStubLessonPlan());

    // Return the coagent snapshot with the plan
    return withCoAgentSnapshot(state, {
      plan,
      phase: "awaiting_approval",
      lastError: null,
    });
  };

  // Get the replan note from the state
  const replanNote = state.approval?.decision === "changes" ? state.approval.note : undefined;

  // Build the user prompt
  const userPrompt = replanNote ? 
                          // Build the user prompt for the replan note
                          `PDF TEXT:
                            <pdf_content>
                            ${state.pdfText}
                            </pdf_content>

                            User requested changes: ${replanNote}

                            Generate a revised lesson plan.`
                            :
                            // Build the user prompt for the new plan
                            `PDF TEXT:
                            <pdf_content>
                            ${state.pdfText}
                            </pdf_content>

                            Generate a lesson plan from this PDF.`;

  // Generate the lesson plan
  const result = await structuredGenerate({
    node: "plan",
    systemPrompt: PLAN_SYSTEM_PROMPT,
    userPrompt,
    schema: LessonPlanSchema,
    getModel: getPlanModel,
    tokensUsed: state.tokensUsed,
  });

  // Check if the result is not ok
  if (!result.ok) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      phase: "planning",
      lastError: result.lastError,
      tokensUsed: result.tokensUsed - state.tokensUsed,
    });
  };

  // Return the coagent snapshot with the plan
  return withCoAgentSnapshot(state, {
    plan: result.data,
    phase: "awaiting_approval",
    lastError: null,
    tokensUsed: result.tokensUsed - state.tokensUsed,
  });
};