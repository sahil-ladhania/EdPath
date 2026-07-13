/**
  * Graph routing tests for the edpath agent.
**/
import { describe, expect, test } from "vitest";
import { routeAfterAwaitInput, routeAfterGenerateMcq } from "./graph.js";
import { MAX_REPAIR } from "./state/constants.js";
import type { GraphState } from "./state/annotation.js";

// Define the function to generate the mcq state
function generateMcqState(partial: Partial<GraphState>): GraphState {
  return {
    questions: [],
    lastError: null,
    mcqGenAttempts: 0,
    pendingResumeKind: null,
    ...partial,
  } as GraphState;
};

// Define the describe block for the route after generate mcq
describe("routeAfterGenerateMcq", () => {
  // Test that proceeds to await_input when questions are ready
  test("proceeds to await_input when questions are ready", () => {
    expect(
      routeAfterGenerateMcq(
        generateMcqState({
          questions: [{ questionId: "q1" }] as GraphState["questions"],
          lastError: null,
        }),
      ),
    ).toBe("await_input");
  });

  // Test that repairs within the retry budget
  test("repairs within the retry budget", () => {
    expect(
      routeAfterGenerateMcq(
        generateMcqState({
          lastError: { node: "generate_mcq", kind: "ungrounded", detail: "x" },
          mcqGenAttempts: MAX_REPAIR,
        }),
      ),
    ).toBe("generate_mcq");
  });

  // Test that pauses for user retry instead of dead-ending after the budget is exhausted
  test("pauses for user retry instead of dead-ending after the budget is exhausted", () => {
    expect(
      routeAfterGenerateMcq(
        generateMcqState({
          lastError: { node: "generate_mcq", kind: "ungrounded", detail: "x" },
          mcqGenAttempts: MAX_REPAIR + 1,
        }),
      ),
    ).toBe("await_input");
  });
});

// Define the describe block for the route after await input
describe("routeAfterAwaitInput", () => {
  // Test that routes a help request to assist
  test("routes a help request to assist", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "help" }),
      ),
    ).toBe("assist");
  });

  // Test that routes an advance signal to advance
  test("routes an advance signal to advance", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "advance" }),
      ),
    ).toBe("advance");
  });

  // Test that routes a retry signal back to generate_mcq
  test("routes a retry signal back to generate_mcq", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "retry" }),
      ),
    ).toBe("generate_mcq");
  });

  // Test that routes a submitted answer to grade
  test("routes a submitted answer to grade", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "answer" }),
      ),
    ).toBe("grade");
  });
});