"use client";

/**
 * Upload status banner — maps API outcomes to user-facing tone and icon.
 */

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface UploadStateBannerProps {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
}

const TONE_ICONS: Record<
  Exclude<UploadStateBannerProps["tone"], "idle">,
  LucideIcon
> = {
  error: AlertCircleIcon,
  success: CheckCircle2Icon,
  loading: LoaderCircleIcon,
};

export function UploadStateBanner({
  tone,
  message,
}: UploadStateBannerProps) {
  if (tone === "idle") {
    return null;
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
      <Icon
        icon={TONE_ICONS[tone]}
        size="sm"
        variant={tone === "error" ? "error" : tone === "success" ? "success" : "brand"}
        className={cn("mt-0.5", tone === "loading" && "animate-spin")}
      />
      <p>{message}</p>
    </div>
  );
}
