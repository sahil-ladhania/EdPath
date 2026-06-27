"use client";

/**
 * Generation loader panel — wraps `GeneratingState` in `Panel`.
 */

import { GeneratingState } from "@/components/ui/GeneratingState";
import { Panel } from "@/components/ui/Panel";

interface GeneratingPanelProps {
  message: string;
  subtext?: string;
}

export function GeneratingPanel({
  message,
  subtext,
}: GeneratingPanelProps): React.JSX.Element {
  return (
    <Panel>
      <GeneratingState message={message} subtext={subtext} />
    </Panel>
  );
}
