import type { RequestHandler } from "express";

import { processUpload } from "./upload.service.js";
import {
  buildUploadLimits,
  createUploadMiddleware,
  sendUploadResult,
  uploadErrorHandler,
  UPLOAD_FIELD_NAME,
} from "./upload-middleware.js";

export {
  buildUploadLimits,
  createUploadMiddleware,
  sendUploadResult,
  uploadErrorHandler,
  UPLOAD_FIELD_NAME,
} from "./upload-middleware.js";

export const uploadMiddleware = createUploadMiddleware();

export const uploadHandler: RequestHandler = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Upload exactly one PDF file." });
    return;
  }

  try {
    const pipelineResult = await processUpload(
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      buildUploadLimits(),
    );

    sendUploadResult(res, pipelineResult.uploadResult);
  } catch (error) {
    console.error(
      "[upload] unexpected error:",
      error instanceof Error ? error.message : error,
    );
    sendUploadResult(res, {
      status: "rejected",
      reason: "unparseable",
      message: "We couldn't read this PDF. It may be corrupted or incomplete.",
    });
  }
};
