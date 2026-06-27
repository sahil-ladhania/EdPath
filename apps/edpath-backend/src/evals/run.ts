import { runEvalSuite, formatSuiteReport } from "./run-suite.js";

const useLlm = process.env.EVAL_LLM === "1" || process.env.EVAL_LLM === "true";
const filter = process.env.EVAL_FILTER;

async function main(): Promise<void> {
  console.log(
    useLlm
      ? "Running Tier-2 eval suite (real LLM + optional judges)..."
      : "Running Tier-2 eval suite (deterministic evaluators only)...",
  );

  if (filter) {
    console.log(`Filter: ${filter}`);
  }

  const suite = await runEvalSuite({
    useLlmJudge: useLlm,
    filter,
  });

  console.log(formatSuiteReport(suite));

  if (suite.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
