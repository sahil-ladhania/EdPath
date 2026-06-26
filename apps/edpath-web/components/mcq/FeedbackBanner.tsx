"use client";

import { CheckCircle2Icon, LightbulbIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FeedbackState } from "@/types/lesson.types";

interface FeedbackBannerProps {
  feedback: FeedbackState | null;
}

export function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  if (!feedback) {
    return null;
  }

  const title =
    feedback.verdict === "correct"
      ? "Correct"
      : feedback.isExhausted
        ? "Review the explanation"
        : "Try again";

  const Icon = feedback.verdict === "correct" ? CheckCircle2Icon : LightbulbIcon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-4",
        feedback.verdict === "correct" &&
          "border-success bg-success-soft text-success-ink",
        feedback.verdict === "incorrect" &&
          "border-error bg-error-soft text-error-ink",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{feedback.detail}</p>
      </div>
    </div>
  );
}
