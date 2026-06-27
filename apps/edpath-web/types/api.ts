/**
 * Frontend API outcome unions for upload and start HTTP calls.
 */

import type { UploadResult } from "@repo/types";

export type StartApiOutcome =
  | { kind: "success"; result: UploadResult }
  | { kind: "transport_error"; message: string };

export type UploadApiOutcome =
  | { kind: "success"; result: UploadResult }
  | { kind: "transport_error"; message: string };
