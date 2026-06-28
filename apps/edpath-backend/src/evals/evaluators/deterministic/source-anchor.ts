/** Deterministic eval: mcqs_grounded dimension — source-anchor on all MCQs. */
import { z } from "zod";

import { isSourceAnchored } from "../../../agent/lib/source-anchor.js";
import { MCQS_PER_OBJECTIVE } from "../../../agent/state/constants.js";
import type { GraphState } from "../../../agent/state/annotation.js";

import type { EvalCheckResult } from "../../types.js";

const McqBatchSchema = z.array(
  z.object({
    questionId: z.string().min(1),
    objectiveId: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().int().nonnegative(),
    explanation: z.string().min(1),
    hint: z.string().min(1),
    sourceQuote: z.string().min(1),
  }),
);

export function evaluateMcqsGrounded(
  state: GraphState,
  allMcqs?: GraphState["questions"],
): EvalCheckResult[] {
  const checks: EvalCheckResult[] = [];
  const questions = allMcqs ?? state.questions;
  if (questions.length === 0) {
    checks.push({
      name: "questions_present",
      passed: false,
      message: "No MCQs collected",
    });
    return checks;
  }

  const parsed = McqBatchSchema.safeParse(questions);
  checks.push({
    name: "mcq_batch_schema",
    passed: parsed.success,
    message: parsed.success
      ? "All MCQs pass structural schema"
      : parsed.error.message,
  });

  for (const mcq of questions) {
    const anchored = isSourceAnchored(mcq.sourceQuote, state.pdfText);
    checks.push({
      name: `source_anchor_${mcq.questionId}`,
      passed: anchored,
      message: anchored
        ? "sourceQuote anchored in pdfText"
        : `sourceQuote not found in pdfText for ${mcq.questionId}`,
    });

    const fourOptions = mcq.options.length === 4;
    checks.push({
      name: `options_count_${mcq.questionId}`,
      passed: fourOptions,
      message: fourOptions
        ? "MCQ has 4 options"
        : `Expected 4 options, got ${mcq.options.length}`,
    });

    const indexInRange =
      mcq.correctIndex >= 0 && mcq.correctIndex < mcq.options.length;
    checks.push({
      name: `correct_index_range_${mcq.questionId}`,
      passed: indexInRange,
      message: indexInRange
        ? "correctIndex in range"
        : `correctIndex ${mcq.correctIndex} out of range`,
    });
  }

  const expectedPerObjective = MCQS_PER_OBJECTIVE;
  const byObjective = new Map<string, number>();
  for (const mcq of questions) {
    byObjective.set(
      mcq.objectiveId,
      (byObjective.get(mcq.objectiveId) ?? 0) + 1,
    );
  }

  for (const [objectiveId, count] of byObjective) {
    checks.push({
      name: `mcq_count_${objectiveId}`,
      passed: count === expectedPerObjective,
      message: `Objective ${objectiveId}: ${count} MCQs (expected ${expectedPerObjective})`,
    });
  }

  return checks;
}
