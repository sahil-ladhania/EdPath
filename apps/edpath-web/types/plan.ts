/**
 * Plan widget and revision hook prop/return contracts.
 */

import type { LessonPlan, Phase } from "@repo/types";

interface UsePlanRevisionOptions {
  plan: LessonPlan | null;
  isRunning: boolean;
  requestPlanRevision: (note: string) => void;
  canRequestPlanRevision: boolean;
}

interface UsePlanRevisionReturn {
  isReviseSubmitting: boolean;
  canSubmitRevision: boolean;
  submitRevision: (note: string) => void;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface PlanReviseChatProps {
  onClose: () => void;
  canSubmitRevision: boolean;
  isSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
}

interface PlanWidgetProps {
  pdfTitle: string;
  plan: LessonPlan;
  phase: Phase;
  onApprove: () => void;
  canSubmitRevision: boolean;
  isReviseSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
}

interface PlanActionsProps {
  objectiveCount: number;
  onApprove: () => void;
  canSubmitRevision: boolean;
  isReviseSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
}

export type {
  ChatMessage,
  PlanActionsProps,
  PlanReviseChatProps,
  PlanWidgetProps,
  UsePlanRevisionOptions,
  UsePlanRevisionReturn,
};
