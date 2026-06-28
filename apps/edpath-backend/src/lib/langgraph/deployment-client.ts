/**
 * LangGraph deployment client — seeds a lesson thread; idempotent create guard.
 */
import { Client } from "@langchain/langgraph-sdk";

import { env } from "../../config/env.js";
import type { GraphUpdate } from "../../agent/state/annotation.js";

export class ThreadAlreadyStartedError extends Error {
  constructor(threadId: string) {
    super(`Thread "${threadId}" already has a seeded lesson.`);
    this.name = "ThreadAlreadyStartedError";
  }
}

export class LangGraphDeploymentError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LangGraphDeploymentError";
    this.cause = cause;
  }
}

export function createLangGraphDeploymentClient(): Client {
  return new Client({ apiUrl: env.EDPATH_LANGGRAPH_DEPLOYMENT_URL });
}

export interface SeedLessonThreadInput {
  threadId: string;
  seed: GraphUpdate;
  client?: Client;
}

export async function seedLessonThread(input: SeedLessonThreadInput): Promise<void> {
  const client = input.client ?? createLangGraphDeploymentClient();

  try {
    await client.threads.create({
      threadId: input.threadId,
      ifExists: "do_nothing",
      graphId: env.EDPATH_LANGGRAPH_GRAPH_ID,
    });

    const existingState = await client.threads.getState(input.threadId);
    const values = existingState.values as Record<string, unknown> | undefined;
    const existingPdfText = values?.pdfText;

    if (typeof existingPdfText === "string" && existingPdfText.length > 0) {
      throw new ThreadAlreadyStartedError(input.threadId);
    }

    await client.threads.updateState(input.threadId, {
      values: input.seed,
    });
  } catch (error) {
    if (error instanceof ThreadAlreadyStartedError) {
      throw error;
    }

    throw new LangGraphDeploymentError(
      "Could not seed the lesson thread on the LangGraph deployment.",
      error,
    );
  }
}
