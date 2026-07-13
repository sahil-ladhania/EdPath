import type { ApprovalInterruptValue, AwaitInputInterruptValue } from "@/types/lesson";

// Function to parse the approval interrupt value
export function parseApprovalInterruptValue( eventValue: ApprovalInterruptValue | string ): ApprovalInterruptValue {
  // If the event value is not a string, return the event value
  if (typeof eventValue !== "string") {
    return eventValue;
  };

  try {
    // Parse the event value as an ApprovalInterruptValue
    return JSON.parse(eventValue) as ApprovalInterruptValue;
  } 
  catch {
    // Return an empty ApprovalInterruptValue
    return {};
  };
};

// Function to parse the await input interrupt value
export function parseAwaitInputInterruptValue( eventValue: AwaitInputInterruptValue | string ): AwaitInputInterruptValue {
  // If the event value is not a string, return the event value
  if (typeof eventValue !== "string") {
    return eventValue;
  };

  try {
    // Parse the event value as an AwaitInputInterruptValue
    return JSON.parse(eventValue) as AwaitInputInterruptValue;
  } 
  catch {
    // Return an empty AwaitInputInterruptValue
    return {};
  };
};

// Function to check if the interrupt is the plan approval gate
export function isApprovalInterrupt(eventValue: ApprovalInterruptValue | string): boolean {
  // Return true if the interrupt is the plan approval gate
  return parseApprovalInterruptValue(eventValue).type === "approval";
};

// Function to check if the interrupt is the MCQ answer/help gate
export function isAwaitInputInterrupt( eventValue: AwaitInputInterruptValue | string ): boolean {
  // Return true if the interrupt is the MCQ answer/help gate
  return parseAwaitInputInterruptValue(eventValue).type === "await_input";
};