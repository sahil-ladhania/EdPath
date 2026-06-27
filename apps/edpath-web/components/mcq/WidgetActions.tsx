"use client";

/**
 * Quiz action bar — submit, retry, and advance driven by feedback verdict.
 */

import { ArrowRightIcon, SendIcon } from "lucide-react";
import type { Feedback } from "@repo/types";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { WidgetActionsProps } from "@/types/mcq";

/** Shows submit, retry, or advance CTA depending on current feedback state. */
export function WidgetActions({
  hasSelection,
  feedback,
  isSubmitting = false,
  canSubmit = true,
  isWaitingForAnswer = false,
  onSubmit,
  onRetry,
  onAdvance,
}: WidgetActionsProps) {
  if (!feedback) {
    return (
      <div className="flex flex-col items-end gap-2">
        {isWaitingForAnswer ? (
          <p className="text-sm text-ink-muted">Waiting for question…</p>
        ) : null}
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!hasSelection || !canSubmit || isSubmitting}
        >
          <Icon icon={SendIcon} size="sm" variant="inverse" />
          {isSubmitting ? "Grading…" : "Submit answer"}
        </Button>
      </div>
    );
  }

  if (feedback.canRetry) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        {isWaitingForAnswer ? (
          <p className="text-sm text-ink-muted sm:mr-auto">
            Waiting for question…
          </p>
        ) : null}
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry question
        </Button>
        {hasSelection ? (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Icon icon={SendIcon} size="sm" variant="inverse" />
            {isSubmitting ? "Grading…" : "Submit answer"}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <Button size="sm" onClick={onAdvance}>
        <Icon icon={ArrowRightIcon} size="sm" variant="inverse" />
        Next question
      </Button>
    </div>
  );
}
