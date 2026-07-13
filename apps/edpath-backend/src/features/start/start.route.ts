/**
 * POST /start route — threadId + PDF upload; maps service errors to HTTP status.
**/
import type { RequestHandler } from "express";
import { buildUploadLimits, createUploadMiddleware, sendUploadResult, uploadErrorHandler, UPLOAD_FIELD_NAME } from "../upload/upload-middleware.js";
import { InvalidThreadIdError, LangGraphDeploymentError, startLesson, ThreadAlreadyStartedError } from "./start.service.js";

// Define the start thread id field
export const START_THREAD_ID_FIELD = "threadId";

// Define the start middleware
export const startMiddleware = createUploadMiddleware();

// Define the start handler
export const startHandler: RequestHandler = async (req, res) => {
  // Check if the request has a file
  if (!req.file) {
    res.status(400).json({ error: "Upload exactly one PDF file." });
    return;
  };

  // Get the thread id from the request body
  const threadId = typeof req.body?.[START_THREAD_ID_FIELD] === "string" ? 
                  req.body[START_THREAD_ID_FIELD].trim()
                  : 
                  "";

  // Check if the thread id is valid
  if (!threadId) {
    res.status(400).json({ error: "A valid threadId is required." });
    return;
  };

  // Start the lesson
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

    // Send the upload result
    sendUploadResult(res, result.uploadResult);
  } 
  catch (error) {
    // Check if the error is an invalid thread id error
    if (error instanceof InvalidThreadIdError) {
      res.status(400).json({ error: error.message });
      return;
    };

    // Check if the error is a thread already started error
    if (error instanceof ThreadAlreadyStartedError) {
      res.status(409).json({ error: error.message });
      return;
    };

    // Check if the error is a langgraph deployment error
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
    };

    console.error(
      "[start] unexpected error:",
      error instanceof Error ? error.message : error,
    );

    // Send the upload result
    sendUploadResult(res, {
      status: "rejected",
      reason: "unparseable",
      message: "We couldn't read this PDF. It may be corrupted or incomplete.",
    });
  };
};

// Export the start error handler and upload field name
export { uploadErrorHandler as startErrorHandler, UPLOAD_FIELD_NAME };