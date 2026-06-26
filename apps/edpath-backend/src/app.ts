import express, { type Express, type Request, type Response } from "express";

import {
  createEdPathCopilotKitRuntime,
  type EdPathCopilotKitOptions,
} from "./copilot/runtime.js";
import {
  uploadErrorHandler,
  uploadHandler,
  uploadMiddleware,
} from "./features/upload/upload.route.js";

export interface CreateAppOptions {
  copilotKit?: EdPathCopilotKitOptions;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.post("/upload", uploadMiddleware, uploadHandler, uploadErrorHandler);

  if (options.copilotKit) {
    const copilotKit = createEdPathCopilotKitRuntime(options.copilotKit);
    app.use(copilotKit.handler);
  }

  return app;
}
