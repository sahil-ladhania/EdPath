/*
  * Contract tests for the feedback state.
*/
import type { CoAgentState, EdPathState, Feedback } from "./index.js";

// Define the exhausted feedback type
type ExhaustedFeedback = Extract<Feedback, { verdict: "exhausted" }>;

// Define the exhausted feedback object
const exhaustedFeedback: ExhaustedFeedback = {
  verdict: "exhausted",
  highlightIndex: 1,
  explanation: "Review how the concept works before continuing.",
  canRetry: false,
};

// Define the function to assert that exhausted feedback does not reveal the correct index
function assertExhaustedFeedbackDoesNotRevealCorrectIndex( feedback: ExhaustedFeedback ): void {
  // @ts-expect-error Exhausted feedback teaches with an explanation but does not reveal the answer index.
  feedback.correctIndex;
};

// Define the function to assert that the state carries feedback
function assertStateCarriesFeedback( coAgentState: CoAgentState, edPathState: EdPathState ): void {
  const webFeedback: Feedback | null = coAgentState.feedback;
  const agentFeedback: Feedback | null = edPathState.feedback;

  void webFeedback;
  void agentFeedback;
};

assertExhaustedFeedbackDoesNotRevealCorrectIndex(exhaustedFeedback);