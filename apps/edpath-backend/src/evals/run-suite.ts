/**
 * Eval suite runner — filters cases, runs scenario + evaluate-case, aggregates report.
*/
import { evaluateCase } from "./evaluate-case.js";
import { runScenario } from "./run-scenario.js";
import { filterEvalCases } from "./scenarios/index.js";
import type { CaseEvalResult, EvalCase, SuiteEvalResult } from "./types.js";

// Define the run suite options
export interface RunSuiteOptions {
  useLlmJudge?: boolean;
  filter?: string;
  tier?: EvalCase["tier"];
  ids?: string[];
};

// Define the function to run the eval suite
export async function runEvalSuite( options: RunSuiteOptions = {} ): Promise<SuiteEvalResult> {
  // Filter the eval cases
  const cases = filterEvalCases({
    filter: options.filter,
    tier: options.tier,
    ids: options.ids,
  });

  // Initialize the results
  const results: CaseEvalResult[] = [];

  // Iterate the eval cases
  for (const evalCase of cases) {
    try {
      // Run the scenario
      const runResult = await runScenario(evalCase);

      // Evaluate the case
      const evaluation = await evaluateCase(evalCase, runResult, {
        useLlmJudge: options.useLlmJudge ?? false,
      });

      // Add the result
      results.push({
        caseId: evalCase.id,
        passed: evaluation.passed,
        dimensions: evaluation.dimensions,
      });
    } 
    catch (error) {
      // Add the result
      results.push({
        caseId: evalCase.id,
        passed: false,
        dimensions: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    };
  };

  // Count the passed cases
  const passed = results.filter((r) => r.passed).length;

  // Return the results
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    cases: results,
  };
};

// Define the function to format the suite report
export function formatSuiteReport(suite: SuiteEvalResult): string {
  // Initialize the lines
  const lines: string[] = [
    `Eval suite: ${suite.passed}/${suite.total} passed`,
    "",
  ];

  // Iterate the results
  for (const result of suite.cases) {
    // Define the status
    const status = result.passed ? "PASS" : "FAIL";

    // Add the case ID
    lines.push(`${status}  ${result.caseId}`);

    // Check if the result has an error
    if (result.error) {
      lines.push(`error: ${result.error}`);
    };

    // Iterate the dimensions
    for (const dimension of result.dimensions) {
      // Check if the dimension failed
      if (!dimension.passed) {
        // Add the dimension
        lines.push(`✗ ${dimension.dimension}`);

        // Iterate the checks
        for (const check of dimension.checks.filter((c) => !c.passed)) {
          // Add the check
          lines.push(`- ${check.name}: ${check.message}`);
        };
      };
    };
  };

  // Return the lines joined by newlines
  return lines.join("\n");
};