/**
 * Integration tests for the eval suite.
**/
import { beforeEach, describe, expect, test } from "vitest";
import { isOpenAiConfigured } from "../config/env.js";
import { setUseStubMcqs } from "../agent/nodes/generate-mcq.js";
import { setUseStubPlan } from "../agent/nodes/plan.js";
import { runEvalSuite } from "./run-suite.js";
import { ALL_EVAL_CASES } from "./scenarios/index.js";

// Define the function to run the LLM evals
const runLlmEvals = process.env.EVAL_LLM === "1" || process.env.EVAL_LLM === "true";

// Define the describe block
describe.skipIf(!runLlmEvals || !isOpenAiConfigured())(
  "EdPath eval suite (Tier 2 — real LLM)",
  () => {
    beforeEach(() => {
      setUseStubPlan(false);
      setUseStubMcqs(false);
    });

    // Define the test
    test(
      "full suite with LLM judges",
      async () => {
        const suite = await runEvalSuite({ useLlmJudge: true });
        expect(suite.total).toBe(ALL_EVAL_CASES.length);
        expect(suite.passed / suite.total).toBeGreaterThanOrEqual(0.95);
      },
      600_000,
    );
  },
);