import axios from "axios";
import { UploadResultSchema } from "@repo/schemas/upload";
import type { UploadApiOutcome } from "@/types/api";

// Field Name for the file
export const UPLOAD_FIELD_NAME = "file";

// Function to get the upload API URL
function getUploadApiUrl(): string {
  // Get the base URL from the environment variables
  const baseUrl = process.env.NEXT_PUBLIC_EDPATH_API_URL;

  // If the base URL is not set, throw an error
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_API_URL is required.");
  };

  return `${baseUrl.replace(/\/$/, "")}/upload`;
};

// Function to upload a PDF by posting the file to `/upload`
export async function uploadPdf(file: File): Promise<UploadApiOutcome> {
  // Create a new FormData object
  const formData = new FormData();

  // Append the file to the form data
  formData.append(UPLOAD_FIELD_NAME, file);

  try {
    // Post the form data to the upload API URL
    const response = await axios.post(getUploadApiUrl(), formData, {
      validateStatus: () => true,
    });

    // If the response status is 400, return a transport error
    if (response.status === 400) {
      // Get the body of the response
      const body = response.data as { error?: string };

      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: body.error ?? "No file was uploaded. Choose a PDF and try again.",
      };
    };

    // If the response status is not 200, return a transport error
    if (response.status < 200 || response.status >= 300) {
      // Return a transport error with the error message
      return {
        kind: "transport_error",
        message: "Something went wrong uploading your file. Try again.",
      };
    };

    // Parse the response data as an UploadResultSchema
    const parsed = UploadResultSchema.safeParse(response.data);

    // If the response data is not a valid UploadResultSchema, return a transport error
    if (!parsed.success) {
      // Return a transport error with the error message
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
      message:
        "Couldn't reach the server. Check your connection and try again.",
    };
  };
};