
// Function to check if the message is an agent transport failure
export function isAgentTransportFailure(message: string): boolean {
  // Normalize the message to lowercase
  const normalized = message.toLowerCase();

  // Return true if the message includes "langgraph", "fetch failed", "retrieve assistant", or "run_error"
  return (
    normalized.includes("langgraph") ||
    normalized.includes("fetch failed") ||
    normalized.includes("retrieve assistant") ||
    normalized.includes("run_error")
  );
};