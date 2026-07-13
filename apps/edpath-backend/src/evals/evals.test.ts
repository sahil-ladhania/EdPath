/**
 * Unit tests for the eval suite.
**/
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { setUseStubMcqs } from "../agent/nodes/generate-mcq.js";
import { setUseStubPlan } from "../agent/nodes/plan.js";
import { evaluateCase } from "./evaluate-case.js";
import { runScenario } from "./run-scenario.js";
import { STUB_TIER_CASES } from "./scenarios/index.js";
import type { EvalCheckResult, EvalDimension } from "./types.js";

// Define the describe block for the stub tier
describe("EdPath eval suite (Tier 1 — stub)", () => {
  beforeEach(() => {
    setUseStubPlan(true);
    setUseStubMcqs(true);
  });

  afterEach(() => {
    setUseStubPlan(false);
    setUseStubMcqs(false);
  });

  // Test to check if the stub tier catalog has expected cases
  test("stub tier catalog has expected cases", () => {
    const ids = STUB_TIER_CASES.map((c) => c.id);
    expect(ids).toContain("HP-01");
    expect(ids).toContain("HP-03");
    expect(ids).toContain("ADV-01");
    expect(ids).toContain("RES-01");
    expect(ids).toContain("RES-02");
  });

  // Test to check if the stub tier cases pass deterministic evaluators
  test.each(STUB_TIER_CASES.map((c) => [c.id, c] as const))(
    "%s passes deterministic evaluators",
    async (_id, evalCase) => {
      const runResult = await runScenario(evalCase, "eval-stub");
      const result = await evaluateCase(evalCase, runResult, {
        useLlmJudge: false,
      });

      if (!result.passed) {
        const failures = result.dimensions
          .filter((d: { passed: boolean }) => !d.passed)
          .flatMap((d: { dimension: EvalDimension; checks: EvalCheckResult[] }) =>
            d.checks
              .filter((c: EvalCheckResult) => !c.passed)
              .map(
                (c: EvalCheckResult) =>
                  `${d.dimension}/${c.name}: ${c.message}`,
              ),
          );
        expect.fail(failures.join("\n"));
      }

      expect(result.passed).toBe(true);
    },
    120_000,
  );
});

// Define the describe block for the eval catalog
describe("EdPath eval catalog", () => {
  // Test to check if the registry contains ~20 cases
  test("registry contains ~20 cases", async () => {
    const { ALL_EVAL_CASES } = await import("./scenarios/index.js");
    expect(ALL_EVAL_CASES.length).toBeGreaterThanOrEqual(20);
  });
});