// Types for the API outcomes
import type { UploadResult } from "@repo/types";

// Type for the start API outcome
export type StartApiOutcome = | { kind: "success"; result: UploadResult } | { kind: "transport_error"; message: string };

// Type for the upload API outcome
export type UploadApiOutcome = | { kind: "success"; result: UploadResult } | { kind: "transport_error"; message: string };