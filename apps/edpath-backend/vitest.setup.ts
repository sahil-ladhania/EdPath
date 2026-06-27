import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), ".");
loadDotenv({ path: resolve(backendRoot, ".env") });

process.env.EDPATH_LANGGRAPH_DEPLOYMENT_URL ??=
  "http://127.0.0.1:2024";
process.env.EDPATH_LANGGRAPH_GRAPH_ID ??= "edpath-agent";

/** Override .env for deterministic CI/local tests — no live LLM or LangSmith. */
process.env.LANGSMITH_TRACING = "false";

// Disable live OpenAI calls so unit/stub-tier tests are deterministic. Setting
// the key to "" (not deleting it) is what makes this stick: config/env.ts calls
// dotenv again at import, and dotenv refuses to overwrite an already-present
// var — whereas a delete lets the .env reload re-fill the real key, which
// silently sent stub-tier evals to the live LLM and made them flaky.
// Opt back in to the live-LLM suite with EVAL_LLM=1 (see evals.integration.test.ts).
const runLlmEvals =
  process.env.EVAL_LLM === "1" || process.env.EVAL_LLM === "true";
if (!runLlmEvals) {
  process.env.OPENAI_API_KEY = "";
}
