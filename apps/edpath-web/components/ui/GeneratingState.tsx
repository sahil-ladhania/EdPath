"use client";

import { LoaderCircleIcon } from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface GeneratingStateProps {
  message: string;
  subtext?: string;
  className?: string;
}

export function GeneratingState({
  message,
  subtext,
  className,
}: GeneratingStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={cn(
        "flex flex-col items-center gap-3 py-8 text-center",
        className,
      )}
    >
      <Icon
        icon={LoaderCircleIcon}
        size="lg"
        variant="brand"
        className="animate-spin"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{message}</p>
        {subtext ? (
          <p className="text-xs leading-snug text-ink-muted">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}
