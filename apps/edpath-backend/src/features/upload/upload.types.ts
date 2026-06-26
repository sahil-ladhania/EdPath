import type { EdPathState, PdfMeta, UploadResult } from "@repo/types";

/** Input to the upload pipeline from the HTTP boundary. */
export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** Tunable upload gate limits (sourced from env at runtime). */
export interface UploadLimits {
  maxBinaryBytes: number;
  maxCleanChars: number;
  maxTokens: number;
  maxPages: number;
  minCleanChars: number;
  minCharsPerPage: number;
}

export type AcceptedUploadResult = Extract<UploadResult, { status: "accepted" }>;
export type RejectedUploadResult = Extract<UploadResult, { status: "rejected" }>;

/** Backend-only pipeline result — `pdfText` never crosses the HTTP boundary. */
export type UploadPipelineResult =
  | {
      ok: true;
      pdfText: string;
      pdfMeta: PdfMeta;
      uploadResult: AcceptedUploadResult;
    }
  | {
      ok: false;
      uploadResult: RejectedUploadResult;
    };

/** Seeds graph state after a successful upload (consumed by a future start-lesson step). */
export type InitialEdPathStateSeed = Pick<EdPathState, "pdfText" | "pdfMeta"> &
  Omit<
    EdPathState,
    "pdfText" | "pdfMeta" | "messages"
  > & {
    messages: EdPathState["messages"];
  };
