// Types for the CopilotKit transport error context
import type { CopilotErrorEvent } from "@copilotkit/shared";

// Type for the CopilotKit transport error
export interface CopilotTransportError {
  // Message for the transport error
  message: string;
  detail: string;
};

// Type for the CopilotKit transport error context value
interface CopilotTransportErrorContextValue {
  transportError: CopilotTransportError | null;
  handleCopilotError: (event: CopilotErrorEvent) => void;
  clearTransportError: () => void;
};

// Export the type for the CopilotKit transport error context value
export type { CopilotTransportErrorContextValue };