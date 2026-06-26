import { UploadResultSchema } from "@repo/schemas/upload";
import type { UploadResult } from "@repo/types";

export const UPLOAD_FIELD_NAME = "file";

export type UploadApiOutcome =
  | { kind: "success"; result: UploadResult }
  | { kind: "transport_error"; message: string };

function getUploadApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  }

  return `${baseUrl.replace(/\/$/, "")}/upload`;
}

export async function uploadPdf(file: File): Promise<UploadApiOutcome> {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD_NAME, file);

  let response: Response;

  try {
    response = await fetch(getUploadApiUrl(), {
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
          body.error ?? "No file was uploaded. Choose a PDF and try again.",
      };
    } catch {
      return {
        kind: "transport_error",
        message: "No file was uploaded. Choose a PDF and try again.",
      };
    }
  }

  if (!response.ok) {
    return {
      kind: "transport_error",
      message: "Something went wrong uploading your file. Try again.",
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
