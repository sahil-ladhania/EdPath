"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CopilotErrorEvent } from "@copilotkit/shared";

import type {
  CopilotTransportError,
  CopilotTransportErrorContextValue,
} from "@/types/copilot";
import { isAgentTransportFailure } from "@/lib/copilot";

const CopilotTransportErrorContext =
  createContext<CopilotTransportErrorContextValue | null>(null);

export function CopilotTransportErrorProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [transportError, setTransportError] =
    useState<CopilotTransportError | null>(null);

  const handleCopilotError = useCallback((event: CopilotErrorEvent): void => {
    if (event.type !== "error" || event.error === undefined) {
      return;
    }

    const rawMessage =
      event.error instanceof Error
        ? event.error.message
        : typeof event.error === "object" &&
            event.error !== null &&
            "message" in event.error &&
            typeof event.error.message === "string"
          ? event.error.message
          : String(event.error);

    if (!isAgentTransportFailure(rawMessage)) {
      return;
    }

    setTransportError({
      message: "Agent connection failed",
      detail:
        "Could not reach the LangGraph dev server. Ensure `npm run langgraph:dev` is running on port 2024 and restart it if the process is hung.",
    });
  }, []);

  const clearTransportError = useCallback((): void => {
    setTransportError(null);
  }, []);

  const value = useMemo(
    (): CopilotTransportErrorContextValue => ({
      transportError,
      handleCopilotError,
      clearTransportError,
    }),
    [clearTransportError, handleCopilotError, transportError],
  );

  return (
    <CopilotTransportErrorContext.Provider value={value}>
      {children}
    </CopilotTransportErrorContext.Provider>
  );
}

export function useCopilotTransportError(): CopilotTransportErrorContextValue {
  const context = useContext(CopilotTransportErrorContext);

  if (!context) {
    throw new Error(
      "useCopilotTransportError must be used within CopilotTransportErrorProvider.",
    );
  }

  return context;
}
