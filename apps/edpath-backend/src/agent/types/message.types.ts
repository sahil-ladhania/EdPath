/** Checkpointed help-thread message contract (assist node). */
export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}
