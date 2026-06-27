import { UploadResultSchema } from "@repo/schemas/upload";

import { UPLOAD_FIELD_NAME } from "@/lib/upload-api";
import type { StartApiOutcome } from "@/types/api";

export const START_THREAD_ID_FIELD = "threadId";

function getStartApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  }

  return `${baseUrl.replace(/\/$/, "")}/start`;
}

export async function startLessonPdf(
  file: File,
  threadId: string,
): Promise<StartApiOutcome> {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file);
  formData.append(START_THREAD_ID_FIELD, threadId);

  let response: Response;

  try {
    response = await fetch(getStartApiUrl(), {
      method: "POST",
      body: formData,
    });
  } catch {
    return {
      kind: "transport_error",
      message:
        "Couldn't reach the server. Check your connection and try again.",
    };
  }

  if (response.status === 400) {
    try {
      const body = (await response.json()) as { error?: string };

      return {
        kind: "transport_error",
        message:
          body.error ??
          "Could not start the lesson. Check your file and try again.",
      };
    } catch {
      return {
        kind: "transport_error",
        message: "Could not start the lesson. Check your file and try again.",
      };
    }
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

  if (!response.ok) {
    return {
      kind: "transport_error",
      message: "Something went wrong starting your lesson. Try again.",
    };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return {
      kind: "transport_error",
      message: "Received an unexpected response from the server. Try again.",
    };
  }

  const parsed = UploadResultSchema.safeParse(body);

  if (!parsed.success) {
    return {
      kind: "transport_error",
      message: "Received an unexpected response from the server. Try again.",
    };
  }

  return { kind: "success", result: parsed.data };
}
