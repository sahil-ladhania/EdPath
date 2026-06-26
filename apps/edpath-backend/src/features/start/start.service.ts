import type { UploadResult } from "@repo/types";

import { buildInitialEdPathState } from "../upload/build-initial-state.js";
import { processUpload } from "../upload/upload.service.js";
import type { UploadFileInput, UploadLimits } from "../upload/upload.types.js";
import { seedGraphState } from "../../agent/state/graph-update.js";
import {
  LangGraphDeploymentError,
  seedLessonThread,
  ThreadAlreadyStartedError,
} from "../../lib/langgraph/deployment-client.js";

export { ThreadAlreadyStartedError } from "../../lib/langgraph/deployment-client.js";

export class InvalidThreadIdError extends Error {
  constructor() {
    super("A valid threadId is required.");
    this.name = "InvalidThreadIdError";
  }
}

const THREAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidThreadId(threadId: string): boolean {
  return THREAD_ID_PATTERN.test(threadId);
}

export type StartLessonResult =
  | { ok: true; uploadResult: Extract<UploadResult, { status: "accepted" }> }
  | { ok: false; uploadResult: Extract<UploadResult, { status: "rejected" }> };

export interface StartLessonInput {
  threadId: string;
  file: UploadFileInput;
  limits: UploadLimits;
}

export async function startLesson(input: StartLessonInput): Promise<StartLessonResult> {
  if (!isValidThreadId(input.threadId)) {
    throw new InvalidThreadIdError();
  }

  const pipelineResult = await processUpload(input.file, input.limits);

  if (!pipelineResult.ok) {
    return { ok: false, uploadResult: pipelineResult.uploadResult };
  }

  const seed = seedGraphState(
    buildInitialEdPathState({
      pdfText: pipelineResult.pdfText,
      pdfMeta: pipelineResult.pdfMeta,
    }),
  );

  await seedLessonThread({
    threadId: input.threadId,
    seed,
  });

  return { ok: true, uploadResult: pipelineResult.uploadResult };
}

export { LangGraphDeploymentError };
