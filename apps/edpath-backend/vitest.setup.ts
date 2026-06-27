import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), ".");
loadDotenv({ path: resolve(backendRoot, ".env") });

process.env.EDPATH_LANGGRAPH_DEPLOYMENT_URL ??=
  "http://127.0.0.1:2024";
process.env.EDPATH_LANGGRAPH_GRAPH_ID ??= "edpath-walking-skeleton";

/** Override .env for deterministic CI/local tests — no live LLM or LangSmith. */
process.env.LANGSMITH_TRACING = "false";
delete process.env.OPENAI_API_KEY;
