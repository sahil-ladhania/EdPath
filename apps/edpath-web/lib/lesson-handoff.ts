import type { PdfMeta } from "@repo/types";

/**
 * Client-side lesson thread helpers.
 *
 * Preview upload validates on file pick (`POST /upload`). Start re-uploads the
 * same PDF with a fresh `threadId` via `POST /start` before navigating to
 * `/lesson/[threadId]` — no server-side upload cache between requests.
 */
export const EDPATH_LAST_THREAD_ID_KEY = "edpath:lastThreadId";

export function createThreadId(): string {
  return crypto.randomUUID();
}

/** Resume hint only — primary identity lives in `/lesson/[threadId]`. */
export function rememberThreadId(threadId: string): void {
  try {
    localStorage.setItem(EDPATH_LAST_THREAD_ID_KEY, threadId);
  } catch {
    // Private mode or storage blocked — URL remains authoritative.
  }
}
