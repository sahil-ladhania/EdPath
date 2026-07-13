/**
 * Grade answer test suite.
 */
import { describe, expect, test } from "vitest";
import { gradeAnswer } from "./grade-answer.js";
import { createStubMcqs } from "../__fixtures__/stubs.js";
import { MAX_ATTEMPTS } from "../state/constants.js";

// Define the describe block for the grade answer test suite
describe("feedback branch routing logic", () => {
  // Define the test for when the attempts reach MAX_ATTEMPTS
  test("exhausted when attempts reach MAX_ATTEMPTS", () => {
    const mcq = createStubMcqs("obj-1")[0]!;
    const output = gradeAnswer({
      selectedIndex: 1,
      mcq,
      priorAttempts: MAX_ATTEMPTS - 1,
    });
    expect(output.verdict).toBe("incorrect");
    expect(output.attempts).toBe(MAX_ATTEMPTS);
  });
});