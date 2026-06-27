/**
 * `POST /start` client — re-uploads PDF with a fresh `threadId` to begin the lesson.
 */

import axios from "axios";
import { UploadResultSchema } from "@repo/schemas/upload";

import { UPLOAD_FIELD_NAME } from "@/api/upload-api";
import type { StartApiOutcome } from "@/types/api";

export const START_THREAD_ID_FIELD = "threadId";

function getStartApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  }

  return `${baseUrl.replace(/\/$/, "")}/start`;
}

/**
 * Starts a lesson by posting the PDF and thread id to `/start`.
 * Returns a discriminated outcome — transport/validation errors never throw.
 */
export async function startLessonPdf(
  file: File,
  threadId: string,
): Promise<StartApiOutcome> {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file);
  formData.append(START_THREAD_ID_FIELD, threadId);

  try {
    const response = await axios.post(getStartApiUrl(), formData, {
      validateStatus: () => true,
    });

    if (response.status === 400) {
      const body = response.data as { error?: string };

      return {
        kind: "transport_error",
        message:
          body.error ??
          "Could not start the lesson. Check your file and try again.",
      };
    }

    if (response.status === 409) {
      return {
        kind: "transport_error",
        message:
          "This lesson was already started. Open it from your link or upload a new PDF.",
      };
    }

    if (response.status === 503) {
      return {
        kind: "transport_error",
        message:
          "The lesson service is temporarily unavailable. Try again in a moment.",
      };
    }

    if (response.status < 200 || response.status >= 300) {
      return {
        kind: "transport_error",
        message: "Something went wrong starting your lesson. Try again.",
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
