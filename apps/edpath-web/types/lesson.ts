// Types for the lesson and interrupt hook contracts
import type { ResumePayload } from "@repo/schemas";
import type { ApprovalDecision, CoAgentState, LessonPlan, Phase } from "@repo/types";
import type { ReactNode } from "react";

// Interface for the approval interrupt value
interface ApprovalInterruptValue {
  type?: string;
  plan?: LessonPlan;
};

// Interface for the await input interrupt value
interface AwaitInputInterruptValue {
  type?: string;
};

// Interface for the use CoAgent lesson return
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
};

// Interface for the approval interrupt bridge props
interface ApprovalInterruptBridgeProps {
  onResolverReady: (
    resolver: ((decision: ApprovalDecision) => void) | null,
  ) => void;
  resolve: (value: string) => void;
};

// Interface for the await input interrupt bridge props
interface AwaitInputInterruptBridgeProps {
  onResolverReady: (resolver: ((payload: ResumePayload) => void) | null) => void;
  resolve: (value: string) => void;
};

// Export the types
export type {
  ApprovalInterruptBridgeProps,
  ApprovalInterruptValue,
  AwaitInputInterruptBridgeProps,
  AwaitInputInterruptValue,
  UseCoAgentLessonReturn,
};