/**
 * Direct unit tests for structuredGenerate (lib/structured-generate.ts) — the
 * bounded-repair reliability primitive. Uses a mock LlmClient via the
 * setLlmClientOverride test hook; no real LLM is ever called.
 */
import { afterEach, describe, expect, test } from "vitest";

import { MAX_REPAIR, TOKEN_CEILING } from "../state/constants.js";
import { setLlmClientOverride, type LlmClient } from "./llm/client.js";
import {
  structuredGenerate,
  type ParseableSchema,
} from "./structured-generate.js";

interface RecordedCall {
  system: string;
  user: string;
  model?: string;
}

/**
 * Builds a mock LlmClient that returns scripted text per call and records each
 * invocation (model + prompts). When the script runs out, it repeats
 * `defaultText` so exhaustion scenarios keep producing parseable output.
 */
function createMockClient(opts: {
  responses?: string[];
  defaultText?: string;
  tokensPerCall?: { input: number; output: number };
}): { client: LlmClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  const client: LlmClient = {
    async invoke(system, user, model) {
      const index = calls.length;
      calls.push({ system, user, model });
      const text =
        opts.responses?.[index] ?? opts.defaultText ?? '{"value": 1}';
      const tokens = opts.tokensPerCall ?? { input: 10, output: 10 };
      return {
        text,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
      };
    },
  };

  return { client, calls };
}

/** Accepts only objects carrying a numeric `value`; fails otherwise. */
const valueSchema: ParseableSchema<{ value: number }> = {
  safeParse(input) {
    if (
      typeof input === "object" &&
      input !== null &&
      "value" in input &&
      typeof (input as { value: unknown }).value === "number"
    ) {
      return { success: true, data: input as { value: number } };
    }
    return { success: false, error: { message: "missing numeric value" } };
  },
};

afterEach(() => {
  setLlmClientOverride(null);
});

describe("structuredGenerate", () => {
  test("repairs malformed JSON: invalid on attempt 1, valid on retry", async () => {
    const { client, calls } = createMockClient({
      responses: ["this is not json {", '{"value": 42}'],
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      tokensUsed: 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe(42);
    }
    // Two invocations: the malformed attempt plus the successful repair.
    expect(calls).toHaveLength(2);
    // The repair prompt feeds the parse error back to the model.
    expect(calls[1]?.user).toContain("valid JSON");
  });

  test("extracts JSON from a fenced code block", async () => {
    const { client } = createMockClient({
      responses: ['```json\n{"value": 7}\n```'],
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      tokensUsed: 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe(7);
    }
  });

  test("fails with schema_drift after exhausting MAX_REPAIR attempts", async () => {
    // Parseable JSON every time, but it never satisfies the schema.
    const { client, calls } = createMockClient({
      defaultText: '{"wrong": true}',
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      tokensUsed: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.lastError.kind).toBe("schema_drift");
      expect(result.lastError.node).toBe("plan");
      expect(result.lastError.detail).toBe("missing numeric value");
    }
    // Loop runs attempt 0..MAX_REPAIR inclusive.
    expect(calls).toHaveLength(MAX_REPAIR + 1);
  });

  test("short-circuits with token_ceiling before calling the LLM", async () => {
    const { client, calls } = createMockClient({
      responses: ['{"value": 1}'],
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      tokensUsed: TOKEN_CEILING,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.lastError.kind).toBe("token_ceiling");
    }
    // The ceiling is enforced before any model call.
    expect(calls).toHaveLength(0);
  });

  test("stops with token_ceiling when a call pushes usage over the cap", async () => {
    const { client, calls } = createMockClient({
      responses: ['{"value": 1}'],
      tokensPerCall: { input: 10, output: 10 },
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      tokensUsed: TOKEN_CEILING - 5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.lastError.kind).toBe("token_ceiling");
      expect(result.lastError.detail).toContain("after LLM call");
    }
    // One call happened, then the post-call ceiling check stopped the loop.
    expect(calls).toHaveLength(1);
  });

  test("selects the escalation model on the final repair attempt", async () => {
    // Distinct model per attempt; getModel(MAX_REPAIR) is the escalation model.
    const getModel = (attempt: number): string =>
      attempt >= MAX_REPAIR ? "escalation-model" : `base-model-${attempt}`;

    // Always parseable but never valid → forces all attempts to run.
    const { client, calls } = createMockClient({
      defaultText: '{"wrong": true}',
    });
    setLlmClientOverride(client);

    const result = await structuredGenerate({
      node: "plan",
      systemPrompt: "sys",
      userPrompt: "user",
      schema: valueSchema,
      getModel,
      tokensUsed: 0,
    });

    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(MAX_REPAIR + 1);

    // Per-attempt model selection, including escalation on the final attempt.
    const modelsUsed = calls.map((call) => call.model);
    const expectedModels = calls.map((_, attempt) => getModel(attempt));
    expect(modelsUsed).toEqual(expectedModels);
    expect(modelsUsed.at(-1)).toBe("escalation-model");
    expect(modelsUsed.at(-1)).toBe(getModel(MAX_REPAIR));
  });
});
