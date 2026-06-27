import type { ResumePayload } from "@repo/schemas";
import type {
  ApprovalDecision,
  CoAgentState,
  Feedback,
  LessonPlan,
  Objective,
  Phase,
  PublicMCQ,
  Summary,
} from "@repo/types";
import type { ReactNode } from "react";

export type QuizPreviewOutcome = "correct" | "incorrect" | "exhausted";

interface QuizMemory {
  triedOptionIndices: number[];
}

interface UseLessonReturn {
  threadId: string;
  state: CoAgentState;
  phase: Phase;
  plan: LessonPlan;
  pdfTitle: string;
  currentObjectiveIndex: number;
  currentQuestionIndex: number;
  currentObjective: Objective;
  currentQuestions: PublicMCQ[];
  currentQuestion: PublicMCQ;
  currentAttempt: number;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  summary: Summary;
  isOptionLocked: boolean;
  setPhase: (phase: Phase) => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  retryQuestion: () => void;
  advance: () => void;
  approvePlan: () => void;
  jumpToObjective: (index: number) => void;
  simulateOutcome: (outcome: QuizPreviewOutcome) => void;
}

interface ApprovalInterruptValue {
  type?: string;
  plan?: LessonPlan;
}

interface AwaitInputInterruptValue {
  type?: string;
}

interface UseCoAgentLessonReturn {
  threadId: string;
  state: CoAgentState;
  phase: Phase;
  plan: LessonPlan | null;
  pdfTitle: string;
  isRunning: boolean;
  canSubmitAnswer: boolean;
  canSubmitHelp: boolean;
  canRequestPlanRevision: boolean;
  approvePlan: () => void;
  requestPlanRevision: (note: string) => void;
  submitAnswer: (selectedIndex: number) => void;
  submitHelp: (text: string) => void;
  advance: () => void;
  retryGeneration: () => void;
  interruptElement: ReactNode;
}

interface ApprovalInterruptBridgeProps {
  onResolverReady: (
    resolver: ((decision: ApprovalDecision) => void) | null,
  ) => void;
  resolve: (value: string) => void;
}

interface AwaitInputInterruptBridgeProps {
  onResolverReady: (resolver: ((payload: ResumePayload) => void) | null) => void;
  resolve: (value: string) => void;
}

export type {
  ApprovalInterruptBridgeProps,
  ApprovalInterruptValue,
  AwaitInputInterruptBridgeProps,
  AwaitInputInterruptValue,
  QuizMemory,
  UseCoAgentLessonReturn,
  UseLessonReturn,
};
