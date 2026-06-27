"use client";

/**
 * Verdict banner — maps correct/incorrect/exhausted to copy and styling.
 */

import { CheckCircle2Icon, LightbulbIcon } from "lucide-react";
import type { Feedback } from "@repo/types";

import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  feedback: Feedback | null;
}

export function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  if (!feedback) {
    return null;
  }

  const title =
    feedback.verdict === "correct"
      ? "Correct"
      : feedback.verdict === "exhausted"
        ? "Review the explanation"
        : "Try again";
  const detail =
    feedback.verdict === "incorrect" ? feedback.hint : feedback.explanation;

  const Icon = feedback.verdict === "correct" ? CheckCircle2Icon : LightbulbIcon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-4",
        feedback.verdict === "correct" &&
          "border-success bg-success-soft text-success-ink",
        feedback.verdict === "incorrect" &&
          "border-error bg-error-soft text-error-ink",
        feedback.verdict === "exhausted" &&
          "border-error bg-error-soft text-error-ink",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{detail}</p>
      </div>
    </div>
  );
}
