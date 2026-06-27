import { describe, expect, test } from "vitest";

import { routeAfterAwaitInput, routeAfterGenerateMcq } from "./graph.js";
import { MAX_REPAIR } from "./state/constants.js";
import type { GraphState } from "./state/annotation.js";

function generateMcqState(partial: Partial<GraphState>): GraphState {
  return {
    questions: [],
    lastError: null,
    mcqGenAttempts: 0,
    pendingResumeKind: null,
    ...partial,
  } as GraphState;
}

describe("routeAfterGenerateMcq", () => {
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

describe("routeAfterAwaitInput", () => {
  test("routes a help request to assist", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "help" }),
      ),
    ).toBe("assist");
  });

  test("routes an advance signal to advance", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "advance" }),
      ),
    ).toBe("advance");
  });

  test("routes a retry signal back to generate_mcq", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "retry" }),
      ),
    ).toBe("generate_mcq");
  });

  test("routes a submitted answer to grade", () => {
    expect(
      routeAfterAwaitInput(
        generateMcqState({ pendingResumeKind: "answer" }),
      ),
    ).toBe("grade");
  });
});
