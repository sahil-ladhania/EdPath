import type { ErrorNode } from "@repo/types";

import { MAX_REPAIR, TOKEN_CEILING } from "../state/constants.js";
import { getLlmClient } from "./llm/client.js";

export interface ParseableSchema<T> {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { message: string } };
}

export interface StructuredGenerateOptions<T> {
  node: ErrorNode;
  systemPrompt: string;
  userPrompt: string;
  schema: ParseableSchema<T>;
  model?: string;
  /** When set, selects the model per repair attempt (overrides `model`). */
  getModel?: (attempt: number) => string;
  tokensUsed: number;
}

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

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate) as unknown;
}

/** LLM call with Zod validation and bounded repair (B5). */
export async function structuredGenerate<T>(
  options: StructuredGenerateOptions<T>,
): Promise<StructuredGenerateResult<T>> {
  const client = getLlmClient();
  let tokensUsed = options.tokensUsed;
  let lastDetail = "Unknown validation error";
  let userPrompt = options.userPrompt;

  for (let attempt = 0; attempt <= MAX_REPAIR; attempt++) {
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
    }

    const model = options.getModel?.(attempt) ?? options.model;
    const result = await client.invoke(
      options.systemPrompt,
      userPrompt,
      model,
      { jsonMode: true },
    );
    tokensUsed += result.inputTokens + result.outputTokens;

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
    }

    let parsed: unknown;
    try {
      parsed = extractJson(result.text);
    } catch (error) {
      lastDetail =
        error instanceof Error ? error.message : "Invalid JSON from model";
      userPrompt = `${options.userPrompt}\n\nYour previous response was invalid JSON: ${lastDetail}. Return ONLY valid JSON.`;
      continue;
    }

    const validated = options.schema.safeParse(parsed);
    if (validated.success) {
      return { ok: true, data: validated.data, tokensUsed };
    }

    lastDetail = validated.error.message;
    userPrompt = `${options.userPrompt}\n\nSchema validation failed: ${lastDetail}. Fix and return ONLY valid JSON.`;
  }

  return {
    ok: false,
    lastError: {
      node: options.node,
      kind: "schema_drift",
      detail: lastDetail,
    },
    tokensUsed,
  };
}
