import type { PdfMeta } from "@repo/types";

/**
 * Client-held handoff for upload-on-start (graph wiring deferred).
 *
 * Preview upload validates the PDF and fills `pdfMeta`; the `File` stays in
 * React memory until a future combined start endpoint re-uploads it in one shot
 * with `threadId` — no server-side upload cache between requests.
 */
export interface LessonStartHandoff {
  threadId: string;
  file: File;
  pdfMeta: PdfMeta;
}

export const EDPATH_LAST_THREAD_ID_KEY = "edpath:lastThreadId";

export function createThreadId(): string {
  return crypto.randomUUID();
}

export function createLessonStartHandoff(input: {
  file: File;
  pdfMeta: PdfMeta;
}): LessonStartHandoff {
  return {
    threadId: createThreadId(),
    file: input.file,
    pdfMeta: input.pdfMeta,
  };
}

/** Resume hint only — primary identity lives in `/lesson/[threadId]`. */
export function rememberThreadId(threadId: string): void {
  try {
    localStorage.setItem(EDPATH_LAST_THREAD_ID_KEY, threadId);
  } catch {
    // Private mode or storage blocked — URL remains authoritative.
  }
}
