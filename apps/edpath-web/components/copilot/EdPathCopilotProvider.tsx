"use client";

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
