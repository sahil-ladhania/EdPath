/**
 * POST /upload route tests.
**/
import type { AddressInfo } from "node:net";
import { describe, expect, test } from "vitest";
import { createApp } from "../../app.js";
import { UPLOAD_FIELD_NAME } from "./upload.route.js";
import { VALID_TEXT_PDF } from "./test-fixtures.js";

describe("POST /upload", () => {
  test("returns validated UploadResult for an accepted PDF", async () => {
    const app = createApp();
    const server = app.listen(0);

    try {
      const address = server.address() as AddressInfo;
      const formData = new FormData();
      formData.append(
        UPLOAD_FIELD_NAME,
        new Blob([VALID_TEXT_PDF], { type: "application/pdf" }),
        "lesson-source.pdf",
      );

      const response = await fetch(`http://127.0.0.1:${address.port}/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        status: string;
        pdfMeta?: { filename: string; charCount: number; pageCount: number };
      };

      expect(body.status).toBe("accepted");
      expect(body.pdfMeta?.filename).toBe("lesson-source.pdf");
      expect(body.pdfMeta?.pageCount).toBe(1);
      expect(body.pdfMeta?.charCount).toBeGreaterThanOrEqual(200);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  test("returns HTTP 400 when no file is uploaded", async () => {
    const app = createApp();
    const server = app.listen(0);

    try {
      const address = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${address.port}/upload`, {
        method: "POST",
        body: new FormData(),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Upload exactly one PDF file.",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});