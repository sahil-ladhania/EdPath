/** HITL interrupt payload shapes (approval_gate, await_input). */
import type { LessonPlan } from "@repo/types";

export interface ApprovalInterruptPayload {
  type: "approval";
  plan: LessonPlan;
}

export interface AwaitInputInterruptPayload {
  type: "await_input";
}

export type ResumeKind = "answer" | "help" | "advance" | "retry";
