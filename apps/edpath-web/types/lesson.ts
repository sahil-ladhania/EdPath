/**
 * Lesson and interrupt hook contracts — CoAgent bridge return shapes.
 */

import type { ResumePayload } from "@repo/schemas";
import type {
  ApprovalDecision,
  CoAgentState,
  LessonPlan,
  Phase,
} from "@repo/types";
import type { ReactNode } from "react";

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
  UseCoAgentLessonReturn,
};
