import {
  CopilotRuntime,
  copilotRuntimeNodeExpressEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import type { RequestHandler } from "express";

import { createWalkingSkeletonState } from "../agent/walking-skeleton.js";

export const COPILOTKIT_ENDPOINT = "/copilotkit";
export const EDPATH_AGENT_ID = "edpath";
export const EDPATH_WALKING_SKELETON_GRAPH_ID = "edpath-walking-skeleton";

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
      [EDPATH_AGENT_ID]: new LangGraphAgent({
        agentId: EDPATH_AGENT_ID,
        description: "EdPath walking-skeleton LangGraph stub",
        deploymentUrl: options.langGraphDeploymentUrl,
        graphId: options.graphId ?? EDPATH_WALKING_SKELETON_GRAPH_ID,
        initialState: createWalkingSkeletonState(),
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
