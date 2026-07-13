/**
 * LangGraph deployment client — seeds a lesson thread; idempotent create guard.
**/
import { Client } from "@langchain/langgraph-sdk";
import { env } from "../../config/env.js";
import type { GraphUpdate } from "../../agent/state/annotation.js";

// Define the thread already started error
export class ThreadAlreadyStartedError extends Error {
  constructor(threadId: string) {
    super(`Thread "${threadId}" already has a seeded lesson.`);
    this.name = "ThreadAlreadyStartedError";
  };
};

// Define the langgraph deployment error
export class LangGraphDeploymentError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LangGraphDeploymentError";
    this.cause = cause;
  };
};

// Define the create langgraph deployment client function
export function createLangGraphDeploymentClient(): Client {
  return new Client({ apiUrl: env.EDPATH_LANGGRAPH_DEPLOYMENT_URL });
};

// Define the seed lesson thread input interface
export interface SeedLessonThreadInput {
  threadId: string;
  seed: GraphUpdate;
  client?: Client;
};

// Define the seed lesson thread function
export async function seedLessonThread(input: SeedLessonThreadInput): Promise<void> {
  // Get the client
  const client = input.client ?? createLangGraphDeploymentClient();

  // Create the thread
  try {
    await client.threads.create({
      threadId: input.threadId,
      ifExists: "do_nothing",
      graphId: env.EDPATH_LANGGRAPH_GRAPH_ID,
    });

    // Get the existing state
    const existingState = await client.threads.getState(input.threadId);

    // Get the values
    const values = existingState.values as Record<string, unknown> | undefined;

    // Get the existing pdf text
    const existingPdfText = values?.pdfText;

    // Check if the existing pdf text is a string and has a length greater than 0
    if (typeof existingPdfText === "string" && existingPdfText.length > 0) {
      throw new ThreadAlreadyStartedError(input.threadId);
    };

    // Update the state
    await client.threads.updateState(input.threadId, {
      values: input.seed,
    });
  }
  catch (error) {
    // Check if the error is a thread already started error
    if (error instanceof ThreadAlreadyStartedError) {
      throw error;
    };

    // Throw a langgraph deployment error
    throw new LangGraphDeploymentError( "Could not seed the lesson thread on the LangGraph deployment.", error);
  };
};