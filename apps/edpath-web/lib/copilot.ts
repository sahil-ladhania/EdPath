/**
 * CopilotKit transport failure heuristics — filters noise from user-facing errors.
 */

/**
 * Returns true when a CopilotKit error message indicates an agent/runtime
 * connection failure (LangGraph unreachable, fetch failed, run_error, etc.).
 */
export function isAgentTransportFailure(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("langgraph") ||
    normalized.includes("fetch failed") ||
    normalized.includes("retrieve assistant") ||
    normalized.includes("run_error")
  );
}
