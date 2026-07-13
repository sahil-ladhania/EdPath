/**
 * Express app bootstrap — validate env, enable LangSmith tracing, listen on PORT.
**/
import { createApp } from "./app.js";
import { env, isLangSmithTracingEnabled } from "./config/env.js";

// Check if LangSmith tracing is enabled but the API key is missing
if (env.LANGSMITH_TRACING === true && !env.LANGSMITH_API_KEY) {
  console.warn("LANGSMITH_TRACING=true but LANGSMITH_API_KEY is missing — tracing disabled.");
};

// Check if LangSmith tracing is enabled
if (isLangSmithTracingEnabled()) {
  console.log(`LangSmith tracing enabled → project "${env.LANGSMITH_PROJECT}" (https://smith.langchain.com)`);
};

// Create the express app
const app = createApp({
  copilotKit: {
    langGraphDeploymentUrl: env.EDPATH_LANGGRAPH_DEPLOYMENT_URL,
    graphId: env.EDPATH_LANGGRAPH_GRAPH_ID,
  },
});

// Get the port from the environment variables
const port = env.PORT;

// Listen on the port and log a message
app.listen(port, () => {
  console.log(`edpath-backend listening on http://localhost:${port}`);
});