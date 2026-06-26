"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function HelpInput() {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-paper p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Need a nudge?</p>
        <p className="text-sm text-ink-muted">
          Ask for a conceptual hint or a quick explanation, then come back to
          the same question.
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
          Ask for help
        </Button>
      </div>
    </div>
  );
}
