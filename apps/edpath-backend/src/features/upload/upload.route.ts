/**
 * POST /upload route — multer → processUpload → typed UploadResult response.
**/

// Import Dependencies
import type { RequestHandler } from "express";
import { processUpload } from "./upload.service.js";

// Define the exportable functions
export { buildUploadLimits, createUploadMiddleware, sendUploadResult, uploadErrorHandler, UPLOAD_FIELD_NAME } from "./upload-middleware.js";  

// Define the upload middleware
export const uploadMiddleware = createUploadMiddleware();

// Define the upload handler
export const uploadHandler: RequestHandler = async (req, res) => {
  // Check if the file is present
  if (!req.file) {
    res.status(400).json({ error: "Upload exactly one PDF file." });
    return;
  };

  // Processing the upload
  try {
    const pipelineResult = await processUpload(
      // File Data
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      // Upload Limits
      buildUploadLimits(),
    );

    // Send the upload result
    sendUploadResult(res, pipelineResult.uploadResult);
  }
  catch (error) {
    console.error(
      "[upload] unexpected error:",
      error instanceof Error ? error.message : error,
    );
    sendUploadResult(res, {
      status: "rejected",
      reason: "unparseable",
      message: "We couldn't read this PDF. It may be corrupted or incomplete.",
    });
  };
};