export function isAgentTransportFailure(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("langgraph") ||
    normalized.includes("fetch failed") ||
    normalized.includes("retrieve assistant") ||
    normalized.includes("run_error")
  );
}
