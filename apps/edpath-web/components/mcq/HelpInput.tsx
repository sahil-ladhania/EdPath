"use client";

import { MessageCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/textarea";

export function HelpInput() {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-paper p-4">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon icon={MessageCircleIcon} size="sm" />
          Need a nudge?
        </p>
        <p className="text-sm text-ink-muted">
          Ask about the idea behind the question. The nudge will keep you with
          the same choices.
        </p>
      </div>
      <Textarea
        rows={3}
        disabled
        value="Ask for a nudge about the idea behind this question."
        onChange={() => undefined}
      />
      <div className="flex justify-end">
        <Button variant="secondary" disabled>
          <Icon icon={MessageCircleIcon} size="sm" variant="brand" />
          Ask for help
        </Button>
      </div>
    </div>
  );
}
