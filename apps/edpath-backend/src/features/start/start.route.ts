/**
 * POST /start route — threadId + PDF upload; maps service errors to HTTP status.
 */
import type { RequestHandler } from "express";

import {
  buildUploadLimits,
  createUploadMiddleware,
  sendUploadResult,
  uploadErrorHandler,
  UPLOAD_FIELD_NAME,
} from "../upload/upload-middleware.js";
import {
  InvalidThreadIdError,
  LangGraphDeploymentError,
  startLesson,
  ThreadAlreadyStartedError,
} from "./start.service.js";

export const START_THREAD_ID_FIELD = "threadId";

export const startMiddleware = createUploadMiddleware();

export const startHandler: RequestHandler = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Upload exactly one PDF file." });
    return;
  }

  const threadId =
    typeof req.body?.[START_THREAD_ID_FIELD] === "string"
      ? req.body[START_THREAD_ID_FIELD].trim()
      : "";

  if (!threadId) {
    res.status(400).json({ error: "A valid threadId is required." });
    return;
  }

  try {
    const result = await startLesson({
      threadId,
      file: {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      limits: buildUploadLimits(),
    });

    sendUploadResult(res, result.uploadResult);
  } catch (error) {
    if (error instanceof InvalidThreadIdError) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof ThreadAlreadyStartedError) {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error instanceof LangGraphDeploymentError) {
      console.error(
        "[start] LangGraph deployment error:",
        error.message,
        error.cause,
      );
      res.status(503).json({
        error:
          "The lesson service is temporarily unavailable. Try again in a moment.",
      });
      return;
    }

    console.error(
      "[start] unexpected error:",
      error instanceof Error ? error.message : error,
    );
    sendUploadResult(res, {
      status: "rejected",
      reason: "unparseable",
      message: "We couldn't read this PDF. It may be corrupted or incomplete.",
    });
  }
};

export { uploadErrorHandler as startErrorHandler, UPLOAD_FIELD_NAME };
