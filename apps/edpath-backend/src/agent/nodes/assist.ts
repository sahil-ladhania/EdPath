/**
 * Assist graph node (N5 / assist).
 *
 * Help side-channel — firewalled input never includes correctIndex or hint.
 * Bounded by MAX_HELP turns; always returns to await_input.
 */
import { isOpenAiConfigured } from "../../config/env.js";
import { getLlmClient } from "../lib/llm/client.js";
import {
  assertAssistFirewall,
  buildAssistInput,
} from "../lib/assist-input.js";
import { ASSIST_SYSTEM_PROMPT } from "../prompts/index.js";
import { MAX_HELP, TOKEN_CEILING } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { AgentMessage } from "../types/message.types.js";

const DECLINE_MESSAGE =
  "You've used all available help turns for this question. Take your best guess and submit an answer when you're ready.";

export async function assistNode(
  state: GraphState,
): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  const helpText = state.pendingHelpText ?? "";
  const atCap = state.helpTurnsUsed >= MAX_HELP;
  const atTokenCeiling = state.tokensUsed >= TOKEN_CEILING;

  let assistantContent: string;
  let tokenDelta = 0;

  if (atCap || atTokenCeiling) {
    assistantContent = DECLINE_MESSAGE;
  } else if (!isOpenAiConfigured()) {
    assistantContent =
      "Consider what the question is asking about the PDF content, then compare each option carefully.";
    assertAssistFirewall(buildAssistInput(state, helpText));
  } else {
    const input = buildAssistInput(state, helpText);
    assertAssistFirewall(input);

    const userPrompt = `PDF TEXT:
<pdf_content>
${input.pdfText}
</pdf_content>

OBJECTIVE: ${input.objectiveTitle}

QUESTION: ${input.question}

OPTIONS:
${input.options.map((o, i) => `${i}. ${o}`).join("\n")}

<student_message>
${input.userMessage}
</student_message>`;

    const client = getLlmClient();
    const result = await client.invoke(ASSIST_SYSTEM_PROMPT, userPrompt);
    assistantContent = result.text;
    tokenDelta = result.inputTokens + result.outputTokens;
  }

  const newMessages: AgentMessage[] = [
    { role: "user", content: helpText },
    { role: "assistant", content: assistantContent },
  ];

  // helpThread mirrors to the MCQ widget; do not append to `messages` — CopilotKit
  // expects LangChain message types there and throws INCOMPLETE_STREAM otherwise.
  return withCoAgentSnapshot(state, {
    helpThread: [...state.helpThread, ...newMessages],
    helpTurnsUsed:
      atCap || atTokenCeiling
        ? state.helpTurnsUsed
        : state.helpTurnsUsed + 1,
    pendingResumeKind: null,
    pendingHelpText: null,
    phase: "awaiting_input",
    tokensUsed: tokenDelta,
  });
}
