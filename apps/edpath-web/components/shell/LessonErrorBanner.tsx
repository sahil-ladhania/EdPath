"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import type { LastError } from "@repo/types";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface LessonErrorBannerProps {
  lastError: LastError;
  title?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function LessonErrorBanner({
  lastError,
  title = "Something went wrong",
  onRetry,
  isRetrying = false,
}: LessonErrorBannerProps): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-error bg-error-soft px-4 py-3 text-sm text-error-ink"
    >
      <Icon icon={AlertCircleIcon} size="sm" variant="error" className="mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-xs leading-snug">{lastError.detail}</p>
        </div>
        {onRetry ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <Icon icon={RefreshCwIcon} size="sm" />
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
