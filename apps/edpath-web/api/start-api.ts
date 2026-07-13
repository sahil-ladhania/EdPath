import axios from "axios";
import { UploadResultSchema } from "@repo/schemas/upload";
import { UPLOAD_FIELD_NAME } from "@/api/upload-api";
import type { StartApiOutcome } from "@/types/api";

// Field Name for threadId
export const START_THREAD_ID_FIELD = "threadId";

// Function to get the start API URL
function getStartApiUrl(): string {
  // Get the base URL from the environment variables
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  // If the base URL is not set, throw an error
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  };

  // Return the start API URL
  return `${baseUrl.replace(/\/$/, "")}/start`;
};

// Function to start a lesson by posting the PDF and thread id to `/start`
export async function startLessonPdf( file: File, threadId: string ): Promise<StartApiOutcome> {
  // Create a new FormData object
  const formData = new FormData();

  // Append the file to the form data
  formData.append(UPLOAD_FIELD_NAME, file);
  formData.append(START_THREAD_ID_FIELD, threadId);

  try {
    // Post the form data to the start API URL
    const response = await axios.post(getStartApiUrl(), formData, {
      validateStatus: () => true,
    });

    // If the response status is 400, return a transport error
    if (response.status === 400) {
      // Get the body of the response
      const body = response.data as { error?: string };

      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: body.error ?? "Could not start the lesson. Check your file and try again.",
      };
    };

    // If the response status is 409, return a transport error
    if (response.status === 409) {
      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: "This lesson was already started. Open it from your link or upload a new PDF.",
      };
    };

    // If the response status is 503, return a transport error
    if (response.status === 503) {
      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: "The lesson service is temporarily unavailable. Try again in a moment.",
      };
    };

    // If the response status is not 200, return a transport error
    if (response.status < 200 || response.status >= 300) {
      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: "Something went wrong starting your lesson. Try again.",
      };
    };

    // Parse the response data as an UploadResultSchema
    const parsed = UploadResultSchema.safeParse(response.data);

    // If the response data is not a valid UploadResultSchema, return a transport error
    if (!parsed.success) {
      return {
        kind: "transport_error",
        message: "Received an unexpected response from the server. Try again.",
      };
    };

    // Return a success with the result
    return { kind: "success", result: parsed.data };
  } 
  catch {
    // Return a transport error with the error message
    return {
      kind: "transport_error",
      message: "Couldn't reach the server. Check your connection and try again.",
    };
  };
};