// Type for the upload banner state
interface UploadBannerState {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
};

// Export the type for the upload banner state
export type { UploadBannerState };