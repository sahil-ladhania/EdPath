"use client";

/**
 * CopilotKit root — runtime URL, agent id, and transport error wiring.
 */

import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";

import {
  CopilotTransportErrorProvider,
  useCopilotTransportError,
} from "@/components/copilot/copilot-transport-error-context";

interface EdPathCopilotProviderProps {
  children: ReactNode;
  threadId?: string;
}

/** Wraps CopilotKit with transport error handling from context. */
function CopilotKitWithErrorHandling({
  children,
  runtimeUrl,
  threadId,
}: {
  children: ReactNode;
  runtimeUrl: string;
  threadId?: string;
}): ReactNode {
  const { handleCopilotError } = useCopilotTransportError();

  return (
    <CopilotKit
      agent="edpath"
      runtimeUrl={runtimeUrl}
      threadId={threadId}
      onError={handleCopilotError}
    >
      {children}
    </CopilotKit>
  );
}

/** Lesson-scoped CopilotKit provider — requires `NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL`. */
export function EdPathCopilotProvider({
  children,
  threadId,
}: EdPathCopilotProviderProps): ReactNode {
  const runtimeUrl = process.env.NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL;

  if (!runtimeUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL is required.");
  }

  return (
    <CopilotTransportErrorProvider>
      <CopilotKitWithErrorHandling runtimeUrl={runtimeUrl} threadId={threadId}>
        {children}
      </CopilotKitWithErrorHandling>
    </CopilotTransportErrorProvider>
  );
}
