/**
 * LLM call + Zod validation + bounded repair (B5).
 * Model selectable per attempt via getModel. 
 * Used by all structured generative nodes.
**/
import type { ErrorNode } from "@repo/types";
import { MAX_REPAIR, TOKEN_CEILING } from "../state/constants.js";
import { getLlmClient } from "./llm/client.js";

// Define the interface for the parseable schema
export interface ParseableSchema<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: { message: string } };
};

// Define the interface for the structured generate options
export interface StructuredGenerateOptions<T> {
  node: ErrorNode;
  systemPrompt: string;
  userPrompt: string;
  schema: ParseableSchema<T>;
  model?: string;
  getModel?: (attempt: number) => string;
  tokensUsed: number;
};

// Define the interface for the structured generate result
export type StructuredGenerateResult<T> =
  | { ok: true; data: T; tokensUsed: number }
  | {
      ok: false;
      lastError: {
        node: ErrorNode;
        kind: "schema_drift" | "token_ceiling";
        detail: string;
      };
      tokensUsed: number;
    };

// Define the function to extract the JSON from the text
function extractJson(text: string): unknown {
  // Trim the text
  const trimmed = text.trim();

  // Match the fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);

  // Get the candidate
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  // Return the parsed JSON
  return JSON.parse(candidate) as unknown;
}

// Define the function to structured generate
export async function structuredGenerate<T>( options: StructuredGenerateOptions<T> ): Promise<StructuredGenerateResult<T>> {
  // Get the client
  const client = getLlmClient();

  // Initialize the tokens used
  let tokensUsed = options.tokensUsed;

  // Initialize the last detail
  let lastDetail = "Unknown validation error";

  // Initialize the user prompt
  let userPrompt = options.userPrompt;

  // Iterate over the attempts
  for (let attempt = 0; attempt <= MAX_REPAIR; attempt++) {
    // Check if the tokens used is greater than the token ceiling
    if (tokensUsed >= TOKEN_CEILING) {
      return {
        ok: false,
        lastError: {
          node: options.node,
          kind: "token_ceiling",
          detail: "Per-run token ceiling exceeded",
        },
        tokensUsed,
      };
    };

    // Get the model
    const model = options.getModel?.(attempt) ?? options.model;

    // Invoke the client
    const result = await client.invoke(
      options.systemPrompt,
      userPrompt,
      model,
      { jsonMode: true },
    );

    // Update the tokens used
    tokensUsed += result.inputTokens + result.outputTokens;

    // Check if the tokens used is greater than the token ceiling
    if (tokensUsed >= TOKEN_CEILING) {
      return {
        ok: false,
        lastError: {
          node: options.node,
          kind: "token_ceiling",
          detail: "Per-run token ceiling exceeded after LLM call",
        },
        tokensUsed,
      };
    };

    // Initialize the parsed
    let parsed: unknown;

    try {
      // Try to extract the JSON
      parsed = extractJson(result.text);
    } 
    catch (error) {
      lastDetail =
        error instanceof Error ? error.message : "Invalid JSON from model";
      userPrompt = `${options.userPrompt}\n\nYour previous response was invalid JSON: ${lastDetail}. Return ONLY valid JSON.`;
      continue;
    };

    // Validate the parsed
    const validated = options.schema.safeParse(parsed);

    // Check if the validated is successful
    if (validated.success) {
      return { ok: true, data: validated.data, tokensUsed };
    };

    // Update the last detail
    lastDetail = validated.error.message;

    // Update the user prompt
    userPrompt = `${options.userPrompt}\n\nSchema validation failed: ${lastDetail}. Fix and return ONLY valid JSON.`;
  };

  // Return the structured generate result
  return {
    ok: false,
    lastError: {
      node: options.node,
      kind: "schema_drift",
      detail: lastDetail,
    },
    tokensUsed,
  };
};