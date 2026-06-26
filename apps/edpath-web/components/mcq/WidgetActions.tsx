"use client";

import type { Feedback } from "@repo/types";

import { Button } from "@/components/ui/button";

interface WidgetActionsProps {
  hasSelection: boolean;
  feedback: Feedback | null;
  onSubmit: () => void;
  onRetry: () => void;
  onAdvance: () => void;
}

export function WidgetActions({
  hasSelection,
  feedback,
  onSubmit,
  onRetry,
  onAdvance,
}: WidgetActionsProps) {
  if (!feedback) {
    return (
      <div className="flex justify-end">
        <Button size="lg" onClick={onSubmit} disabled={!hasSelection}>
          Submit answer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      {feedback.canRetry ? (
        <Button size="lg" variant="outline" onClick={onRetry}>
          Retry question
        </Button>
      ) : null}
      {!feedback.canRetry ? (
        <Button size="lg" onClick={onAdvance}>
          Next question
        </Button>
      ) : null}
    </div>
  );
}
