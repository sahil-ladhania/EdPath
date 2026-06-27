/**
 * CopilotKit transport error context types.
 */

import type { CopilotErrorEvent } from "@copilotkit/shared";

export interface CopilotTransportError {
  message: string;
  detail: string;
}

interface CopilotTransportErrorContextValue {
  transportError: CopilotTransportError | null;
  handleCopilotError: (event: CopilotErrorEvent) => void;
  clearTransportError: () => void;
}

export type { CopilotTransportErrorContextValue };
