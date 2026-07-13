/**
 * OpenAI LLM client (B8) — the only IO boundary in agent/lib.
 * Provides invoke + model selection for structured-generate and assist.
**/
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../../../config/env.js";
import { MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS, MAX_REPAIR } from "../../state/constants.js";

// Define the interface for the LLM call result
export interface LlmCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

// Define the interface for the LLM invoke options
export interface LlmInvokeOptions {
  jsonMode?: boolean;
};

// Define the interface for the LLM client
export interface LlmClient {
  invoke(
    system: string,
    user: string,
    model?: string,
    options?: LlmInvokeOptions,
  ): Promise<LlmCallResult>;
};

// Initialize the LLM client override
let llmClientOverride: LlmClient | null = null;

// Define the function to set the LLM client override
export function setLlmClientOverride(client: LlmClient | null): void {
  llmClientOverride = client;
};

// Define the function to create the OpenAI client
function createOpenAiClient(model: string, jsonMode: boolean): ChatOpenAI {
  // Return the OpenAI client
  return new ChatOpenAI({
    model,
    apiKey: env.OPENAI_API_KEY,
    temperature: 0,
    maxTokens: MAX_OUTPUT_TOKENS,
    ...(
          jsonMode ? 
          { modelKwargs: { response_format: { type: "json_object" } } }
          : 
          {}
      ),
  });
};

// Define the function to create the default LLM client
export function createDefaultLlmClient(): LlmClient {
  // Return the default LLM client
  return {
    // Define the function to invoke the LLM
    async invoke( system: string, user: string, model: string = env.OPENAI_MODEL, options?: LlmInvokeOptions ): Promise<LlmCallResult> {
      // Create the OpenAI client
      const chat = createOpenAiClient(model, options?.jsonMode ?? false);

      // Invoke the chat
      const response = await chat.invoke([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);

      // Get the text
      const text = typeof response.content === "string" ? 
                                                        response.content
                                                        : 
                                                        response.content.map((part) => ("text" in part ? part.text : "")).join("");

      // Get the usage
      const usage = response.usage_metadata;

      // Get the input tokens
      const inputTokens = usage?.input_tokens ?? Math.min(user.length / 4, MAX_INPUT_TOKENS);

      // Calculate the output tokens
      const outputTokens = usage?.output_tokens ?? Math.min(text.length / 4, MAX_OUTPUT_TOKENS);

      // Return the LLM call result
      return { text, inputTokens, outputTokens };
    },
  };
};

// Define the function to get the LLM client
export function getLlmClient(): LlmClient {
  // Return the LLM client override or the default LLM client
  return llmClientOverride ?? createDefaultLlmClient();
};

// Define the function to get the plan model
export function getPlanModel(repairAttempt: number): string {
  // Return the plan model
  return repairAttempt >= MAX_REPAIR - 1
    ? env.OPENAI_PLAN_ESCAPE_MODEL
    : env.OPENAI_MODEL;
};

// Define the function to get the default model
export function getDefaultModel(): string {
  // Return the default model
  return env.OPENAI_MODEL;
};

// Define the function to get the plan escape model
export function getPlanEscapeModel(): string {
  // Return the plan escape model
  return env.OPENAI_PLAN_ESCAPE_MODEL;
};