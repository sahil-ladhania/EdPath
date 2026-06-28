/**
 * CopilotKit runtime registration — mounts the LangGraph agent Express endpoint.
 */
import {
  CopilotRuntime,
  copilotRuntimeNodeExpressEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import type { RequestHandler } from "express";

import { createInitialCoAgentState } from "../agent/initial-coagent-state.js";
import { EdPathLangGraphAgent } from "./edpath-langgraph-agent.js";

export const COPILOTKIT_ENDPOINT = "/copilotkit";
export const EDPATH_AGENT_ID = "edpath";
export const EDPATH_AGENT_GRAPH_ID = "edpath-agent";

export interface EdPathCopilotKitOptions {
  langGraphDeploymentUrl: string;
  graphId?: string;
  endpoint?: string;
}

export interface EdPathCopilotKitRuntime {
  endpoint: string;
  runtime: CopilotRuntime;
  handler: RequestHandler;
}

export function createEdPathCopilotKitRuntime(
  options: EdPathCopilotKitOptions,
): EdPathCopilotKitRuntime {
  const endpoint = options.endpoint ?? COPILOTKIT_ENDPOINT;
  const runtime = new CopilotRuntime({
    agents: {
      [EDPATH_AGENT_ID]: new EdPathLangGraphAgent({
        agentId: EDPATH_AGENT_ID,
        description: "EdPath LangGraph teaching workflow",
        deploymentUrl: options.langGraphDeploymentUrl,
        graphId: options.graphId ?? EDPATH_AGENT_GRAPH_ID,
        initialState: createInitialCoAgentState(),
      }),
    },
  });

  const handler = copilotRuntimeNodeExpressEndpoint({
    endpoint,
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
  }) as RequestHandler;

  return {
    endpoint,
    runtime,
    handler,
  };
}
