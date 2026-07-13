/**
 * Upload pipeline DTOs — HTTP input, limits, pipeline result, graph seed type.
**/
import type { EdPathState, PdfMeta, UploadResult } from "@repo/types";

// Define the upload file input interface
export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

// Define the upload limits interface
export interface UploadLimits {
  maxBinaryBytes: number;
  maxCleanChars: number;
  maxTokens: number;
  maxPages: number;
  minCleanChars: number;
  minCharsPerPage: number;
};

// Define the accepted upload result type
export type AcceptedUploadResult = Extract<UploadResult, { status: "accepted" }>;

// Define the rejected upload result type
export type RejectedUploadResult = Extract<UploadResult, { status: "rejected" }>;

// Define the upload pipeline result type
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

// Define the initial ed path state seed type
export type InitialEdPathStateSeed = Pick<EdPathState, "pdfText" | "pdfMeta"> & Omit<EdPathState, "pdfText" | "pdfMeta" | "messages"> & { messages: EdPathState["messages"] };