"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function HelpInput() {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-paper p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Need help?</p>
        <p className="text-sm text-ink-muted">
          This is the visual placeholder for the firewalled assist side-channel.
          CopilotKit wiring lands in the next session.
        </p>
      </div>
      <Textarea
        rows={3}
        disabled
        value="Ask for a hint or more context here — connects to the assist node next session."
        onChange={() => undefined}
      />
      <div className="flex justify-end">
        <Button variant="secondary" disabled>
          Ask for help - deferred
        </Button>
      </div>
    </div>
  );
}
