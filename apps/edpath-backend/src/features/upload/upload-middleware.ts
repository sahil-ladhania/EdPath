import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { UploadResultSchema } from "@repo/schemas";

import { env } from "../../config/env.js";
import type { UploadLimits } from "./upload.types.js";

export const UPLOAD_FIELD_NAME = "file";

export function buildUploadLimits(): UploadLimits {
  return {
    maxBinaryBytes: env.UPLOAD_MAX_BINARY_BYTES,
    maxCleanChars: env.UPLOAD_MAX_CLEAN_CHARS,
    maxTokens: env.UPLOAD_MAX_TOKENS,
    maxPages: env.UPLOAD_MAX_PAGES,
    minCleanChars: env.UPLOAD_MIN_CLEAN_CHARS,
    minCharsPerPage: env.UPLOAD_MIN_CHARS_PER_PAGE,
  };
}

export function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: env.UPLOAD_MAX_BINARY_BYTES,
      files: 1,
    },
  }).single(UPLOAD_FIELD_NAME);
}

export function sendUploadResult(
  res: Parameters<RequestHandler>[1],
  uploadResult: Parameters<typeof UploadResultSchema.parse>[0],
): void {
  const validated = UploadResultSchema.parse(uploadResult);
  res.status(200).json(validated);
}

/** Maps multer size-limit errors to typed upload rejections (HTTP 200). */
export const uploadErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const maxMb = Math.round(env.UPLOAD_MAX_BINARY_BYTES / (1024 * 1024));
      sendUploadResult(res, {
        status: "rejected",
        reason: "over_ceiling",
        message: `This PDF is too large for one focused lesson. Choose a file under ${maxMb} MB.`,
      });
      return;
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ error: "Upload exactly one PDF file." });
      return;
    }
  }

  next(err);
};
