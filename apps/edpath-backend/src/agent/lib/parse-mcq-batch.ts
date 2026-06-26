import { McqBatchSchema } from "@repo/schemas";
import type { MCQ } from "@repo/types";

/** Normalizes common LLM JSON shapes to `{ questions: MCQ[] }`. */
export function normalizeMcqBatch(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { questions: raw };
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    if (Array.isArray(record.questions)) {
      return raw;
    }

    if (Array.isArray(record.mcqs)) {
      return { questions: record.mcqs };
    }
  }

  return raw;
}

export const McqBatchResponseParser = {
  safeParse(
    input: unknown,
  ): { success: true; data: MCQ[] } | { success: false; error: { message: string } } {
    const normalized = normalizeMcqBatch(input);
    const parsed = McqBatchSchema.safeParse(normalized);

    if (!parsed.success) {
      return {
        success: false,
        error: { message: parsed.error.message },
      };
    }

    return {
      success: true,
      data: parsed.data.questions,
    };
  },
};
