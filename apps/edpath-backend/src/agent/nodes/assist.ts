/**
 * Assist graph node (N5 / assist).
 * Help side-channel — firewalled input never includes correctIndex or hint.
 * Bounded by MAX_HELP turns; always returns to await_input.
**/
import { isOpenAiConfigured } from "../../config/env.js";
import { getLlmClient } from "../lib/llm/client.js";
import { assertAssistFirewall, buildAssistInput } from "../lib/assist-input.js";
import { ASSIST_SYSTEM_PROMPT } from "../prompts/index.js";
import { MAX_HELP, TOKEN_CEILING } from "../state/constants.js";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { AgentMessage } from "../types/message.types.js";

// Define the decline message
const DECLINE_MESSAGE =
  "You've used all available help turns for this question. Take your best guess and submit an answer when you're ready.";

// Define the function to create the assist node
export async function assistNode( state: GraphState ): Promise<ReturnType<typeof withCoAgentSnapshot>> {
  // Get the help text from the state
  const helpText = state.pendingHelpText ?? "";

  // Check if the help turns used is greater than or equal to the maximum help turns
  const atCap = state.helpTurnsUsed >= MAX_HELP;

  // Check if the tokens used is greater than or equal to the token ceiling
  const atTokenCeiling = state.tokensUsed >= TOKEN_CEILING;

  // Define the assistant content
  let assistantContent: string;

  // Define the token delta
  let tokenDelta = 0;

  // Check if the help turns used is greater than or equal to the maximum help turns or the tokens used is greater than or equal to the token ceiling
  if (atCap || atTokenCeiling) {
    // Set the assistant content to the decline message
    assistantContent = DECLINE_MESSAGE;
  }
  else if (!isOpenAiConfigured()) {
    assistantContent = "Consider what the question is asking about the PDF content, then compare each option carefully.";
    assertAssistFirewall(buildAssistInput(state, helpText));
  } 
  else {
    // Build the assist input
    const input = buildAssistInput(state, helpText);

    // Assert the assist firewall
    assertAssistFirewall(input);

    // Build the user prompt
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

    // Get the LLM client
    const client = getLlmClient();

    // Invoke the LLM client
    const result = await client.invoke(ASSIST_SYSTEM_PROMPT, userPrompt);

    // Set the assistant content to the result text
    assistantContent = result.text;

    // Set the token delta to the input tokens plus the output tokens
    tokenDelta = result.inputTokens + result.outputTokens;
  };

  // Build the new messages
  const newMessages: AgentMessage[] = [
    { role: "user", content: helpText },
    { role: "assistant", content: assistantContent },
  ];

  // Return the coagent snapshot with the new messages
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
};