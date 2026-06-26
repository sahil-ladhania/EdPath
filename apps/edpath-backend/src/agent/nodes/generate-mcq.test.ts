import { describe, expect, test } from "vitest";

import { createStubMcqs } from "../__fixtures__/stubs.js";
import {
  McqBatchResponseParser,
  normalizeMcqBatch,
} from "../lib/parse-mcq-batch.js";

describe("McqBatchResponseParser", () => {
  const validMcqs = createStubMcqs("obj-1");

  test("accepts wrapped object with questions key", () => {
    const result = McqBatchResponseParser.safeParse({ questions: validMcqs });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0]?.questionId).toBe("obj-1-q1");
    }
  });

  test("accepts bare array via normalizer", () => {
    const normalized = normalizeMcqBatch(validMcqs);
    const result = McqBatchResponseParser.safeParse(normalized);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
    }
  });

  test("accepts mcqs alias via normalizer", () => {
    const result = McqBatchResponseParser.safeParse({ mcqs: validMcqs });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
    }
  });

  test("rejects wrong count with descriptive Zod message", () => {
    const result = McqBatchResponseParser.safeParse({
      questions: validMcqs.slice(0, 2),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/3/i);
    }
  });

  test("rejects invalid MCQ fields with path detail", () => {
    const invalid = [
      ...validMcqs.slice(0, 2),
      {
        ...validMcqs[2],
        correctIndex: "2",
      },
    ];

    const result = McqBatchResponseParser.safeParse({ questions: invalid });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/correctIndex|number/i);
    }
  });

  test("rejects non-array object root", () => {
    const result = McqBatchResponseParser.safeParse({ foo: validMcqs });

    expect(result.success).toBe(false);
  });
});
