interface UploadBannerState {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
}

export type { UploadBannerState };
