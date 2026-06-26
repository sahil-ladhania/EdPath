"use client";

import { ArrowRightIcon, SendIcon } from "lucide-react";
import type { Feedback } from "@repo/types";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

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
          <Icon icon={SendIcon} size="sm" variant="inverse" />
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
          <Icon icon={ArrowRightIcon} size="sm" variant="inverse" />
          Next question
        </Button>
      ) : null}
    </div>
  );
}
