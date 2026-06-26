import type { Feedback, PublicMCQ } from "@repo/types";

import { McqWidget } from "@/components/mcq/McqWidget";

const publicQuestion: PublicMCQ = {
  questionId: "q-contract",
  objectiveId: "obj-contract",
  question: "Which statement best matches the source concept?",
  options: ["First option", "Second option", "Third option", "Fourth option"],
};

const exhaustedFeedback: Feedback = {
  verdict: "exhausted",
  highlightIndex: 1,
  explanation: "The source explains the concept before asking you to continue.",
  canRetry: false,
};

export function QuizFirewallContract(): React.JSX.Element {
  return (
    <McqWidget
      objectiveTitle="Contract objective"
      questionNumber={1}
      questionCount={3}
      currentAttempt={3}
      question={publicQuestion}
      selectedIndex={1}
      triedOptionIndices={[0, 1]}
      feedback={exhaustedFeedback}
      isOptionLocked={true}
      onSelect={() => undefined}
      onSubmit={() => undefined}
      onRetry={() => undefined}
      onAdvance={() => undefined}
    />
  );
}
