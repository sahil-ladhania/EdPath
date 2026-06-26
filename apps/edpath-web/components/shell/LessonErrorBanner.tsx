"use client";

import { AlertCircleIcon } from "lucide-react";
import type { LastError } from "@repo/types";

import { Icon } from "@/components/ui/Icon";

interface LessonErrorBannerProps {
  lastError: LastError;
  title?: string;
}

export function LessonErrorBanner({
  lastError,
  title = "Something went wrong",
}: LessonErrorBannerProps): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-error bg-error-soft px-4 py-3 text-sm text-error-ink"
    >
      <Icon icon={AlertCircleIcon} size="sm" variant="error" className="mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs leading-snug">{lastError.detail}</p>
      </div>
    </div>
  );
}
