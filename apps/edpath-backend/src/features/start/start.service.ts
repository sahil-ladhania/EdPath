/**
 * Start-lesson service — upload PDF, build seed, seed LangGraph thread.
 * Validates threadId (UUID v4); maps deployment errors to typed throws.
**/

// Import Dependencies
import type { UploadResult } from "@repo/types";
import { buildInitialEdPathState } from "../upload/build-initial-state.js";
import { processUpload } from "../upload/upload.service.js";
import type { UploadFileInput, UploadLimits } from "../upload/upload.types.js";
import { seedGraphState } from "../../agent/state/graph-update.js";
import { LangGraphDeploymentError, seedLessonThread, ThreadAlreadyStartedError } from "../../lib/langgraph/deployment-client.js";

// Export the thread already started error
export { ThreadAlreadyStartedError } from "../../lib/langgraph/deployment-client.js";

// Define the invalid thread id error
export class InvalidThreadIdError extends Error {
  constructor() {
    super("A valid threadId is required.");
    this.name = "InvalidThreadIdError";
  };
};

// Define the thread id pattern
const THREAD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Define the is valid thread id function
export function isValidThreadId(threadId: string): boolean {
  // Return true if the thread id matches the pattern
  return THREAD_ID_PATTERN.test(threadId);
};

// Define the start lesson result type
export type StartLessonResult = | { ok: true; uploadResult: Extract<UploadResult, { status: "accepted" }> } | { ok: false; uploadResult: Extract<UploadResult, { status: "rejected" }> };

// Define the start lesson input interface
export interface StartLessonInput {
  threadId: string;
  file: UploadFileInput;
  limits: UploadLimits;
};

// Define the start lesson function
export async function startLesson(input: StartLessonInput): Promise<StartLessonResult> {
  // Check if the thread id is valid
  if (!isValidThreadId(input.threadId)) {
    throw new InvalidThreadIdError();
  };

  // Process the upload
  const pipelineResult = await processUpload(input.file, input.limits);

  // Check if the upload is rejected
  if (!pipelineResult.ok) {
    return { ok: false, uploadResult: pipelineResult.uploadResult };
  };

  // Build the seed
  const seed = seedGraphState(
    buildInitialEdPathState({
      pdfText: pipelineResult.pdfText,
      pdfMeta: pipelineResult.pdfMeta,
    }),
  );

  // Seed the lesson thread
  await seedLessonThread({
    threadId: input.threadId,
    seed,
  });

  // Return the success result
  return { ok: true, uploadResult: pipelineResult.uploadResult };
};

// Export the langgraph deployment error
export { LangGraphDeploymentError };