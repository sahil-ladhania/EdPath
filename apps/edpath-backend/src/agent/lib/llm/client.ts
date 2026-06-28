/**
 * OpenAI LLM client singleton (B8) — the only IO boundary in agent/lib.
 *
 * Provides invoke + model selection for structured-generate and assist.
 */
import { ChatOpenAI } from "@langchain/openai";

import { env } from "../../../config/env.js";
import {
  MAX_INPUT_TOKENS,
  MAX_OUTPUT_TOKENS,
  MAX_REPAIR,
} from "../../state/constants.js";

export interface LlmCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LlmInvokeOptions {
  /** When true, requests OpenAI JSON object mode for structured generative nodes. */
  jsonMode?: boolean;
}

export interface LlmClient {
  invoke(
    system: string,
    user: string,
    model?: string,
    options?: LlmInvokeOptions,
  ): Promise<LlmCallResult>;
}

let llmClientOverride: LlmClient | null = null;

/** Test hook — inject a mock LLM client. */
export function setLlmClientOverride(client: LlmClient | null): void {
  llmClientOverride = client;
}

function createOpenAiClient(model: string, jsonMode: boolean): ChatOpenAI {
  return new ChatOpenAI({
    model,
    apiKey: env.OPENAI_API_KEY,
    temperature: 0,
    maxTokens: MAX_OUTPUT_TOKENS,
    ...(jsonMode
      ? { modelKwargs: { response_format: { type: "json_object" } } }
      : {}),
  });
}

/** Default OpenAI-backed LLM client (B8). */
export function createDefaultLlmClient(): LlmClient {
  return {
    async invoke(
      system: string,
      user: string,
      model: string = env.OPENAI_MODEL,
      options?: LlmInvokeOptions,
    ): Promise<LlmCallResult> {
      const chat = createOpenAiClient(model, options?.jsonMode ?? false);
      const response = await chat.invoke([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);

      const text =
        typeof response.content === "string"
          ? response.content
          : response.content
              .map((part) => ("text" in part ? part.text : ""))
              .join("");

      const usage = response.usage_metadata;
      const inputTokens =
        usage?.input_tokens ?? Math.min(user.length / 4, MAX_INPUT_TOKENS);
      const outputTokens =
        usage?.output_tokens ?? Math.min(text.length / 4, MAX_OUTPUT_TOKENS);

      return { text, inputTokens, outputTokens };
    },
  };
}

export function getLlmClient(): LlmClient {
  return llmClientOverride ?? createDefaultLlmClient();
}

/**
 * On the final repair attempt (MAX_REPAIR - 1), switches to the escape
 * model to recover from repeated schema-drift failures.
 */
export function getPlanModel(repairAttempt: number): string {
  return repairAttempt >= MAX_REPAIR - 1
    ? env.OPENAI_PLAN_ESCAPE_MODEL
    : env.OPENAI_MODEL;
}

export function getDefaultModel(): string {
  return env.OPENAI_MODEL;
}

export function getPlanEscapeModel(): string {
  return env.OPENAI_PLAN_ESCAPE_MODEL;
}
