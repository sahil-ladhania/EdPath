/**
 * Eval CLI entry — EVAL_LLM and EVAL_FILTER env knobs; exits 1 on failures.
**/
import { runEvalSuite, formatSuiteReport } from "./run-suite.js";

// Define the use LLM flag
const useLlm = process.env.EVAL_LLM === "1" || process.env.EVAL_LLM === "true";

// Define the filter
const filter = process.env.EVAL_FILTER;

// Define the main function
async function main(): Promise<void> {
  // Log the use LLM flag
  console.log(
    useLlm
      ? "Running Tier-2 eval suite (real LLM + optional judges)..."
      : "Running Tier-2 eval suite (deterministic evaluators only)...",
  );

  // Check if the filter is set
  if (filter) {
    console.log(`Filter: ${filter}`);
  };

  // Run the eval suite
  const suite = await runEvalSuite({
    useLlmJudge: useLlm,
    filter,
  });

  // Log the suite report
  console.log(formatSuiteReport(suite));

  // Check if the suite failed
  if (suite.failed > 0) {
    process.exitCode = 1;
  };
};

// Define the main function
main().catch((error) => {
  // Log the error
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});