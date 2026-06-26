import { createApp } from "./app.js";
import { env } from "./config/env.js";

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
