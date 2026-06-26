import type { CoAgentState, EdPathState, Feedback } from "./index.js";

type ExhaustedFeedback = Extract<Feedback, { verdict: "exhausted" }>;

const exhaustedFeedback: ExhaustedFeedback = {
  verdict: "exhausted",
  highlightIndex: 1,
  explanation: "Review how the concept works before continuing.",
  canRetry: false,
};

function assertExhaustedFeedbackDoesNotRevealCorrectIndex(
  feedback: ExhaustedFeedback,
): void {
  // @ts-expect-error Exhausted feedback teaches with an explanation but does not reveal the answer index.
  feedback.correctIndex;
}

function assertStateCarriesFeedback(
  coAgentState: CoAgentState,
  edPathState: EdPathState,
): void {
  const webFeedback: Feedback | null = coAgentState.feedback;
  const agentFeedback: Feedback | null = edPathState.feedback;

  void webFeedback;
  void agentFeedback;
}

assertExhaustedFeedbackDoesNotRevealCorrectIndex(exhaustedFeedback);
