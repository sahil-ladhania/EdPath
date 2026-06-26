/** Minimal checkpointed message shape (agent-local; D20). */
export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}
