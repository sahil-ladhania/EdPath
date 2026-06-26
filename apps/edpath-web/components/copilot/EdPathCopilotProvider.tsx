"use client";

import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";

interface EdPathCopilotProviderProps {
  children: ReactNode;
  threadId?: string;
}

export function EdPathCopilotProvider({
  children,
  threadId,
}: EdPathCopilotProviderProps): ReactNode {
  const runtimeUrl = process.env.NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL;

  if (!runtimeUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL is required.");
  }

  return (
    <CopilotKit
      agent="edpath"
      runtimeUrl={runtimeUrl}
      threadId={threadId}
    >
      {children}
    </CopilotKit>
  );
}
