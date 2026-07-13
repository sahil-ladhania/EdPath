// Import testing library and types
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { CoAgentState, Feedback, PublicMCQ } from "@repo/types";
import { getEmptyCoAgentState } from "@/lib/empty-co-agent-state";
import { useCoAgentQuiz } from "@/hooks/useCoAgentQuiz";
import type { UseCoAgentQuizOptions } from "@/types/mcq";

// Constant for the question
const QUESTION: PublicMCQ = {
  questionId: "obj-1-q1",
  objectiveId: "obj-1",
  question: "What is the capital of France?",
  options: ["Paris", "London", "Berlin", "Madrid"],
};

// Function to make the state
function makeState(overrides: Partial<CoAgentState> = {}): CoAgentState {
  return {
    ...getEmptyCoAgentState(),
    questions: [QUESTION],
    currentQuestionIndex: 0,
    phase: "awaiting_input",
    ...overrides,
  };
};

// Function to make the options
function makeOptions(
  overrides: Partial<UseCoAgentQuizOptions> = {},
): UseCoAgentQuizOptions {
  return {
    state: makeState(),
    plan: null,
    submitAnswer: vi.fn(),
    submitHelp: vi.fn(),
    advance: vi.fn(),
    canSubmitAnswer: true,
    canSubmitHelp: true,
    isRunning: false,
    ...overrides,
  };
};

// Constant for the correct feedback
const CORRECT_FEEDBACK: Feedback = {
  verdict: "correct",
  highlightIndex: 0,
  explanation: "Paris is the capital of France.",
  canRetry: false,
};

// Constant for the incorrect feedback
const INCORRECT_FEEDBACK: Feedback = {
  verdict: "incorrect",
  highlightIndex: 1,
  hint: "Think about the Eiffel Tower's location.",
  canRetry: true,
};

// After each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Describe the useCoAgentQuiz hook
describe("useCoAgentQuiz", () => {
  // Test to check if the submit locks the widget and the correct feedback keeps it locked until advance
  test("submit locks the widget, and correct feedback keeps it locked until advance", () => {
    const submitAnswer = vi.fn();
    const advance = vi.fn();
    const initialProps = makeOptions({ submitAnswer, advance, isRunning: true });

    const { result, rerender } = renderHook(
      (props: UseCoAgentQuizOptions) => useCoAgentQuiz(props),
      { initialProps },
    );

    act(() => result.current.selectOption(0));
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.isOptionLocked).toBe(false);

    act(() => result.current.submitAnswer());
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    expect(submitAnswer).toHaveBeenCalledWith(0);
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.isOptionLocked).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    rerender(makeOptions({
      submitAnswer,
      advance,
      isRunning: false,
      state: makeState({ feedback: CORRECT_FEEDBACK, attempts: 1 }),
    }));

    expect(result.current.feedback?.verdict).toBe("correct");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isOptionLocked).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.advance());
    expect(advance).toHaveBeenCalledTimes(1);
  });

  // Test to check if a help turn does not corrupt answer-submit state and re-enables on reply
  test("a help turn does not corrupt answer-submit state and re-enables on reply", () => {
    const submitHelp = vi.fn();
    const submitAnswer = vi.fn();
    const initialProps = makeOptions({
      submitHelp,
      submitAnswer,
      canSubmitHelp: true,
      isRunning: true,
      state: makeState({ helpTurnsUsed: 0, helpThread: [] }),
    });

    const { result, rerender } = renderHook(
      (props: UseCoAgentQuizOptions) => useCoAgentQuiz(props),
      { initialProps },
    );

    act(() => result.current.selectOption(2));
    expect(result.current.selectedIndex).toBe(2);

    act(() => result.current.submitHelp("I'm stuck"));
    expect(submitHelp).toHaveBeenCalledTimes(1);
    expect(result.current.isHelpSubmitting).toBe(true);

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.selectedIndex).toBe(2);
    expect(result.current.isOptionLocked).toBe(false);
    expect(submitAnswer).not.toHaveBeenCalled();

    rerender(makeOptions({
      submitHelp,
      submitAnswer,
      canSubmitHelp: true,
      isRunning: false,
      state: makeState({
        helpTurnsUsed: 1,
        helpThread: [
          { role: "user", content: "I'm stuck" },
          { role: "assistant", content: "Consider the landmark's city." },
        ],
      }),
    }));

    expect(result.current.isHelpSubmitting).toBe(false);
    expect(result.current.selectedIndex).toBe(2);
    expect(result.current.isSubmitting).toBe(false);
  });

  // Test to check if retry after incorrect returns the widget to a submittable state
  test("retry after incorrect returns the widget to a submittable state", () => {
    const submitAnswer = vi.fn();
    const initialProps = makeOptions({
      submitAnswer,
      state: makeState({ feedback: INCORRECT_FEEDBACK, attempts: 1 }),
    });

    const { result } = renderHook(
      (props: UseCoAgentQuizOptions) => useCoAgentQuiz(props),
      { initialProps },
    );

    // Incorrect feedback present but retry not yet unlocked → locked, no submit.
    expect(result.current.isOptionLocked).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    // Retry unlocks the radios and clears the prior selection (no auto-resubmit).
    act(() => result.current.retryQuestion());
    expect(result.current.isOptionLocked).toBe(false);
    expect(result.current.selectedIndex).toBe(null);
    expect(result.current.canSubmit).toBe(false);
    expect(submitAnswer).not.toHaveBeenCalled();

    // Choosing a fresh option makes it submittable again.
    act(() => result.current.selectOption(3));
    expect(result.current.selectedIndex).toBe(3);
    expect(result.current.canSubmit).toBe(true);
  });
});