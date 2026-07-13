// Types for the plan widget and revision hook prop/return contracts
import type { LessonPlan, Phase } from "@repo/types";

// Interface for the use plan revision options
interface UsePlanRevisionOptions {
  plan: LessonPlan | null;
  isRunning: boolean;
  requestPlanRevision: (note: string) => void;
  canRequestPlanRevision: boolean;
};

// Interface for the use plan revision return
interface UsePlanRevisionReturn {
  isReviseSubmitting: boolean;
  canSubmitRevision: boolean;
  submitRevision: (note: string) => void;
};

// Interface for the chat message
interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
};

// Interface for the plan revise chat props
interface PlanReviseChatProps {
  onClose: () => void;
  canSubmitRevision: boolean;
  isSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
};

// Interface for the plan widget props
interface PlanWidgetProps {
  pdfTitle: string;
  plan: LessonPlan;
  phase: Phase;
  onApprove: () => void;
  canSubmitRevision: boolean;
  isReviseSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
};

// Interface for the plan actions props
interface PlanActionsProps {
  objectiveCount: number;
  onApprove: () => void;
  canSubmitRevision: boolean;
  isReviseSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
};    

// Export the types
export type {
  ChatMessage,
  PlanActionsProps,
  PlanReviseChatProps,
  PlanWidgetProps,
  UsePlanRevisionOptions,
  UsePlanRevisionReturn,
};