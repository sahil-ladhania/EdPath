"use client";

// Import React and types
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CopilotErrorEvent } from "@copilotkit/shared";
import type { CopilotTransportError, CopilotTransportErrorContextValue } from "@/types/copilot";
import { isAgentTransportFailure } from "@/lib/copilot";

// Constant for the copilot transport error context
const CopilotTransportErrorContext = createContext<CopilotTransportErrorContextValue | null>(null);

// Function to provide the copilot transport error provider
export function CopilotTransportErrorProvider({ children }: { children: ReactNode; }): React.JSX.Element {
  // useState Hook to store the transport error
  const [transportError, setTransportError] = useState<CopilotTransportError | null>(null);

  // useCallback Hook to handle the copilot error
  const handleCopilotError = useCallback((event: CopilotErrorEvent): void => {
    // Check if the event type is not an error or the error is undefined
    if (event.type !== "error" || event.error === undefined) {
      return;
    };

    // Get the raw message
    const rawMessage =
      event.error instanceof Error
        ? event.error.message
        : typeof event.error === "object" &&
            event.error !== null &&
            "message" in event.error &&
            typeof event.error.message === "string"
          ? event.error.message
          : String(event.error);

    // Check if the raw message is not an agent transport failure
    if (!isAgentTransportFailure(rawMessage)) {
      return;
    };

    // Set the transport error
    setTransportError({
      message: "Agent connection failed",
      detail: "Could not reach the LangGraph dev server. Ensure `npm run langgraph:dev` is running on port 2024 and restart it if the process is hung.",
    });
  }, []);

  // useCallback Hook to clear the transport error
  const clearTransportError = useCallback((): void => {
    // Set the transport error to null
    setTransportError(null);
  }, []);

  // useMemo Hook to create the value
  const value = useMemo(
    // Function to create the value
    (): CopilotTransportErrorContextValue => ({
      transportError,
      handleCopilotError,
      clearTransportError,
    }),
    [clearTransportError, handleCopilotError, transportError],
  );

  // Return the copilot transport error provider
  return (
    <CopilotTransportErrorContext.Provider value={value}>
      {children}
    </CopilotTransportErrorContext.Provider>
  );
};

// Function to use the copilot transport error
export function useCopilotTransportError(): CopilotTransportErrorContextValue {
  // useContext Hook to get the context
  const context = useContext(CopilotTransportErrorContext);

  // Check if the context is null
  if (!context) {
    // Throw an error if the context is not found
    throw new Error(
      "useCopilotTransportError must be used within CopilotTransportErrorProvider.",
    );
  };

  // Return the context
  return context;
};