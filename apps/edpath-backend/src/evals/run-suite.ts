import { evaluateCase } from "./evaluate-case.js";
import { runScenario } from "./run-scenario.js";
import { filterEvalCases } from "./scenarios/index.js";
import type { CaseEvalResult, EvalCase, SuiteEvalResult } from "./types.js";

export interface RunSuiteOptions {
  useLlmJudge?: boolean;
  filter?: string;
  tier?: EvalCase["tier"];
  ids?: string[];
}

export async function runEvalSuite(
  options: RunSuiteOptions = {},
): Promise<SuiteEvalResult> {
  const cases = filterEvalCases({
    filter: options.filter,
    tier: options.tier,
    ids: options.ids,
  });

  const results: CaseEvalResult[] = [];

  for (const evalCase of cases) {
    try {
      const runResult = await runScenario(evalCase);
      const evaluation = await evaluateCase(evalCase, runResult, {
        useLlmJudge: options.useLlmJudge ?? false,
      });

      results.push({
        caseId: evalCase.id,
        passed: evaluation.passed,
        dimensions: evaluation.dimensions,
      });
    } catch (error) {
      results.push({
        caseId: evalCase.id,
        passed: false,
        dimensions: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    cases: results,
  };
}

export function formatSuiteReport(suite: SuiteEvalResult): string {
  const lines: string[] = [
    `Eval suite: ${suite.passed}/${suite.total} passed`,
    "",
  ];

  for (const result of suite.cases) {
    const status = result.passed ? "PASS" : "FAIL";
    lines.push(`${status}  ${result.caseId}`);
    if (result.error) {
      lines.push(`       error: ${result.error}`);
    }
    for (const dimension of result.dimensions) {
      if (!dimension.passed) {
        lines.push(`       ✗ ${dimension.dimension}`);
        for (const check of dimension.checks.filter((c) => !c.passed)) {
          lines.push(`         - ${check.name}: ${check.message}`);
        }
      }
    }
  }

  return lines.join("\n");
}
