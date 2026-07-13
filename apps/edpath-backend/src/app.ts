/**
 * Express app factory — /health, /upload, /start, optional CopilotKit handler.
**/
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import { createEdPathCopilotKitRuntime, type EdPathCopilotKitOptions } from "./copilot/runtime.js";
import { env } from "./config/env.js";
import { uploadErrorHandler, uploadHandler, uploadMiddleware } from "./features/upload/upload.route.js";
import { startErrorHandler, startHandler, startMiddleware } from "./features/start/start.route.js";

// Define the development web origin
const DEV_WEB_ORIGIN = "http://localhost:3000";

// Define the options for the createApp function
export interface CreateAppOptions {
  copilotKit?: EdPathCopilotKitOptions;
};

// Define Factory Function
export function createApp(options: CreateAppOptions = {}): Express {
  // Create the express app
  const app = express();

  // Enable CORS for the development environment
  if (env.NODE_ENV === "development") {
    app.use(
      cors({
        origin: DEV_WEB_ORIGIN,
      }),
    );
  };

  // Parse the request body as JSON
  app.use(express.json());

  // Define the health check route
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Define the upload route
  app.post("/upload", uploadMiddleware, uploadHandler, uploadErrorHandler);

  // Define the start route
  app.post("/start", startMiddleware, startHandler, startErrorHandler);

  // If the copilot kit options are provided, use the copilot kit runtime
  if (options.copilotKit) {
    const copilotKit = createEdPathCopilotKitRuntime(options.copilotKit);
    app.use(copilotKit.handler);
  };

  return app;
};