import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

import {
  createEdPathCopilotKitRuntime,
  type EdPathCopilotKitOptions,
} from "./copilot/runtime.js";
import { env } from "./config/env.js";
import {
  uploadErrorHandler,
  uploadHandler,
  uploadMiddleware,
} from "./features/upload/upload.route.js";

const DEV_WEB_ORIGIN = "http://localhost:3000";

export interface CreateAppOptions {
  copilotKit?: EdPathCopilotKitOptions;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  if (env.NODE_ENV === "development") {
    app.use(
      cors({
        origin: DEV_WEB_ORIGIN,
      }),
    );
  }

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
