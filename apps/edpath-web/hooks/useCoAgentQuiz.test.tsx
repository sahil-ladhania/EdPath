/**
 * Interaction-invariant tests for useCoAgentQuiz.
 *
 * Scope: the local quiz UX state the hook owns (selection, submit locking,
 * help-turn isolation, retry reset). Grading, feedback content, and control
 * flow live on the graph and are NOT exercised here — these tests assert only
 * that the widget cannot drive an illegal interaction.
 */
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import type { CoAgentState, Feedback, PublicMCQ } from "@repo/types";

import { getEmptyCoAgentState } from "@/lib/empty-co-agent-state";
import { useCoAgentQuiz } from "@/hooks/useCoAgentQuiz";
import type { UseCoAgentQuizOptions } from "@/types/mcq";

const QUESTION: PublicMCQ = {
  questionId: "obj-1-q1",
  objectiveId: "obj-1",
  question: "What is the capital of France?",
  options: ["Paris", "London", "Berlin", "Madrid"],
};

function makeState(overrides: Partial<CoAgentState> = {}): CoAgentState {
  return {
    ...getEmptyCoAgentState(),
    questions: [QUESTION],
    currentQuestionIndex: 0,
    phase: "awaiting_input",
    ...overrides,
  };
}

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
}

const CORRECT_FEEDBACK: Feedback = {
  verdict: "correct",
  highlightIndex: 0,
  explanation: "Paris is the capital of France.",
  canRetry: false,
};

const INCORRECT_FEEDBACK: Feedback = {
  verdict: "incorrect",
  highlightIndex: 1,
  hint: "Think about the Eiffel Tower's location.",
  canRetry: true,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useCoAgentQuiz", () => {
  test("submit locks the widget, and correct feedback keeps it locked until advance", () => {
    const submitAnswer = vi.fn();
    const advance = vi.fn();
    // isRunning: true models the in-flight graph run a submit kicks off — the
    // hook clears isSubmitting as a safety fallback when no run is active.
    const initialProps = makeOptions({ submitAnswer, advance, isRunning: true });

    const { result, rerender } = renderHook(
      (props: UseCoAgentQuizOptions) => useCoAgentQuiz(props),
      { initialProps },
    );

    // Pick an option → submittable.
    act(() => result.current.selectOption(0));
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.isOptionLocked).toBe(false);

    // Submit → exactly one intent sent, and the widget locks so the UI cannot
    // fire a second submit (canSubmit/isOptionLocked are the double-submit guard).
    act(() => result.current.submitAnswer());
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    expect(submitAnswer).toHaveBeenCalledWith(0);
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.isOptionLocked).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    // Correct feedback mirrors back from the graph and the run ends. Submitting
    // clears, the widget stays locked (no retry), and the only path forward is
    // advance.
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

    // Select an option first; a help turn must not disturb the selection.
    act(() => result.current.selectOption(2));
    expect(result.current.selectedIndex).toBe(2);

    act(() => result.current.submitHelp("I'm stuck"));
    expect(submitHelp).toHaveBeenCalledTimes(1);
    expect(result.current.isHelpSubmitting).toBe(true);
    // Help turns never grade an answer: answer-submit state is untouched and
    // radios are not locked.
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.selectedIndex).toBe(2);
    expect(result.current.isOptionLocked).toBe(false);
    expect(submitAnswer).not.toHaveBeenCalled();

    // Assistant reply lands in the mirrored thread → help input re-enables.
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
