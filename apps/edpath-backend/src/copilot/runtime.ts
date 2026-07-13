/**
 * CopilotKit runtime registration — mounts the LangGraph agent Express endpoint.
**/
import { CopilotRuntime, copilotRuntimeNodeExpressEndpoint, ExperimentalEmptyAdapter } from "@copilotkit/runtime";
import type { RequestHandler } from "express";
import { createInitialCoAgentState } from "../agent/initial-coagent-state.js";
import { EdPathLangGraphAgent } from "./edpath-langgraph-agent.js";

// Define the constants
export const COPILOTKIT_ENDPOINT = "/copilotkit";
export const EDPATH_AGENT_ID = "edpath";
export const EDPATH_AGENT_GRAPH_ID = "edpath-agent";

// Define the interface for the EdPath CopilotKit options
export interface EdPathCopilotKitOptions {
  langGraphDeploymentUrl: string;
  graphId?: string;
  endpoint?: string;
};

// Define the interface for the EdPath CopilotKit runtime
export interface EdPathCopilotKitRuntime {
  endpoint: string;
  runtime: CopilotRuntime;
  handler: RequestHandler;
};

// Define the function to create the EdPath CopilotKit runtime
export function createEdPathCopilotKitRuntime( options: EdPathCopilotKitOptions ): EdPathCopilotKitRuntime {
  // Get the endpoint from the options
  const endpoint = options.endpoint ?? COPILOTKIT_ENDPOINT;

  // Create the CopilotRuntime
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

  // Create the handler
  const handler = copilotRuntimeNodeExpressEndpoint({
    endpoint,
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
  }) as RequestHandler;

  // Return the EdPath CopilotKit runtime
  return {
    endpoint,
    runtime,
    handler,
  };
};