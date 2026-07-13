"use client";

// Import React and types
import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";
import { CopilotTransportErrorProvider, useCopilotTransportError } from "@/components/copilot/copilot-transport-error-context";

// Interface for the ed path copilot provider props
interface EdPathCopilotProviderProps {
  children: ReactNode;
  threadId?: string;
};

// Function to wrap the copilot kit with error handling
function CopilotKitWithErrorHandling({ children, runtimeUrl, threadId }: { children: ReactNode; runtimeUrl: string; threadId?: string; }): ReactNode {
  // useCopilotTransportError Hook to get the handle copilot error function
  const { handleCopilotError } = useCopilotTransportError();

  // Return the copilot kit with error handling
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
};

// Function to render the ed path copilot provider
export function EdPathCopilotProvider({ children, threadId }: EdPathCopilotProviderProps): ReactNode {
  // Get the runtime url from the environment variables
  const runtimeUrl = process.env.NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL;

  // Check if the runtime url is not set
  if (!runtimeUrl) {
    throw new Error("NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL is required.");
  };

  // Return the ed path copilot provider
  return (
    <CopilotTransportErrorProvider>
      <CopilotKitWithErrorHandling runtimeUrl={runtimeUrl} threadId={threadId}>
        {children}
      </CopilotKitWithErrorHandling>
    </CopilotTransportErrorProvider>
  );
};