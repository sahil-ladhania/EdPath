/**
 * MCQ batch normalizer — coerces common LLM JSON shapes before Zod validation.
**/
import { McqBatchSchema } from "@repo/schemas";
import type { MCQ } from "@repo/types";

// Define the function to normalize the MCQ batch
export function normalizeMcqBatch(raw: unknown): unknown {
  // Check if the raw is an array
  if (Array.isArray(raw)) {
    // Return the raw as the questions
    return { questions: raw };
  };

  // Check if the raw is an object
  if (raw && typeof raw === "object") {
    // Get the record from the raw
    const record = raw as Record<string, unknown>;

    // Check if the questions is an array
    if (Array.isArray(record.questions)) {
      return raw;
    };

    // Check if the mcqs is an array
    if (Array.isArray(record.mcqs)) {
      return { questions: record.mcqs };
    };
  };

  // Return the raw
  return raw;
};


// Define the McqBatchResponseParser
export const McqBatchResponseParser = {
  // Define the function to safe parse the input
  safeParse(input: unknown): { success: true; data: MCQ[] } | { success: false; error: { message: string } } {
    // Normalize the input
    const normalized = normalizeMcqBatch(input);

    // Parse the normalized input
    const parsed = McqBatchSchema.safeParse(normalized);

    // Check if the parsed is not successful
    if (!parsed.success) {
      return {
        success: false,
        error: { message: parsed.error.message },
      };
    };

    // Return the success and data
    return {
      success: true,
      data: parsed.data.questions,
    };
  },
};