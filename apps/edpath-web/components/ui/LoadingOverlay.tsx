"use client";

import { GeneratingState } from "@/components/ui/GeneratingState";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isActive: boolean;
  message: string;
  subtext?: string;
  className?: string;
}

export function LoadingOverlay({
  isActive,
  message,
  subtext,
  className,
}: LoadingOverlayProps): React.JSX.Element | null {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <Panel
        size="sm"
        className="w-full max-w-sm shadow-[var(--shadow-md)]"
      >
        <GeneratingState message={message} subtext={subtext} />
      </Panel>
    </div>
  );
}
