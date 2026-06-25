"use client";

import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface UploadStateBannerProps {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
}

export function UploadStateBanner({
  tone,
  message,
}: UploadStateBannerProps) {
  const Icon =
    tone === "error"
      ? AlertCircleIcon
      : tone === "success"
        ? CheckCircle2Icon
        : tone === "loading"
          ? LoaderCircleIcon
          : AlertCircleIcon;

  if (tone === "idle") {
    return (
      <div className="rounded-lg border border-border bg-paper px-4 py-3 text-sm text-ink-muted">
        {message}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        tone === "error" && "border-error bg-error-soft text-error-ink",
        tone === "success" && "border-success bg-success-soft text-success-ink",
        tone === "loading" && "border-primary bg-primary-soft text-primary",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "loading" && "animate-spin")} />
      <p>{message}</p>
    </div>
  );
}
