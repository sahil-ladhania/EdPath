import { createApp } from "./app.js";
import { env, isLangSmithTracingEnabled } from "./config/env.js";

if (env.LANGSMITH_TRACING === true && !env.LANGSMITH_API_KEY) {
  console.warn(
    "LANGSMITH_TRACING=true but LANGSMITH_API_KEY is missing — tracing disabled.",
  );
}

if (isLangSmithTracingEnabled()) {
  console.log(
    `LangSmith tracing enabled → project "${env.LANGSMITH_PROJECT}" (https://smith.langchain.com)`,
  );
}

const app = createApp({
  copilotKit: {
    langGraphDeploymentUrl: env.EDPATH_LANGGRAPH_DEPLOYMENT_URL,
    graphId: env.EDPATH_LANGGRAPH_GRAPH_ID,
  },
});
const port = env.PORT;

app.listen(port, () => {
  console.log(`edpath-backend listening on http://localhost:${port}`);
});
