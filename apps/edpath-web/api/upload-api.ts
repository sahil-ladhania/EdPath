/**
 * `POST /upload` client — preview validation on file pick (landing page).
 */

import axios from "axios";
import { UploadResultSchema } from "@repo/schemas/upload";

import type { UploadApiOutcome } from "@/types/api";

export const UPLOAD_FIELD_NAME = "file";

function getUploadApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  }

  return `${baseUrl.replace(/\/$/, "")}/upload`;
}

/**
 * Validates a PDF via `/upload` before the user starts the lesson.
 * Returns a discriminated outcome — transport/validation errors never throw.
 */
export async function uploadPdf(file: File): Promise<UploadApiOutcome> {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file);

  try {
    const response = await axios.post(getUploadApiUrl(), formData, {
      validateStatus: () => true,
    });

    if (response.status === 400) {
      const body = response.data as { error?: string };

      return {
        kind: "transport_error",
        message:
          body.error ?? "No file was uploaded. Choose a PDF and try again.",
      };
    }

    if (response.status < 200 || response.status >= 300) {
      return {
        kind: "transport_error",
        message: "Something went wrong uploading your file. Try again.",
      };
    }

    const parsed = UploadResultSchema.safeParse(response.data);

    if (!parsed.success) {
      return {
        kind: "transport_error",
        message: "Received an unexpected response from the server. Try again.",
      };
    }

    return { kind: "success", result: parsed.data };
  } catch {
    return {
      kind: "transport_error",
      message:
        "Couldn't reach the server. Check your connection and try again.",
    };
  }
}
