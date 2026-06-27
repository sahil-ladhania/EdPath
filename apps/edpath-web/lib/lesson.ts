/**
 * LangGraph interrupt helpers — parse and classify approval vs await-input payloads.
 */

import type {
  ApprovalInterruptValue,
  AwaitInputInterruptValue,
} from "@/types/lesson";

/** Parses interrupt payloads that may arrive as JSON strings. Returns `{}` on failure. */
export function parseApprovalInterruptValue(
  eventValue: ApprovalInterruptValue | string,
): ApprovalInterruptValue {
  if (typeof eventValue !== "string") {
    return eventValue;
  }

  try {
    return JSON.parse(eventValue) as ApprovalInterruptValue;
  } catch {
    return {};
  }
}

/** Parses await-input interrupt payloads that may arrive as JSON strings. Returns `{}` on failure. */
export function parseAwaitInputInterruptValue(
  eventValue: AwaitInputInterruptValue | string,
): AwaitInputInterruptValue {
  if (typeof eventValue !== "string") {
    return eventValue;
  }

  try {
    return JSON.parse(eventValue) as AwaitInputInterruptValue;
  } catch {
    return {};
  }
}

/** Type guard — true when the interrupt is the plan approval gate. */
export function isApprovalInterrupt(eventValue: ApprovalInterruptValue | string): boolean {
  return parseApprovalInterruptValue(eventValue).type === "approval";
}

/** Type guard — true when the interrupt is the MCQ answer/help gate. */
export function isAwaitInputInterrupt(
  eventValue: AwaitInputInterruptValue | string,
): boolean {
  return parseAwaitInputInterruptValue(eventValue).type === "await_input";
}
