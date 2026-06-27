import type {
  ApprovalInterruptValue,
  AwaitInputInterruptValue,
} from "@/types/lesson";

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

export function isApprovalInterrupt(eventValue: ApprovalInterruptValue | string): boolean {
  return parseApprovalInterruptValue(eventValue).type === "approval";
}

export function isAwaitInputInterrupt(
  eventValue: AwaitInputInterruptValue | string,
): boolean {
  return parseAwaitInputInterruptValue(eventValue).type === "await_input";
}
