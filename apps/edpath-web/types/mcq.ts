import type {
  CoAgentState,
  Feedback,
  HelpThreadMessage,
  LessonPlan,
  PublicMCQ,
} from "@repo/types";

interface UseCoAgentQuizOptions {
  state: CoAgentState;
  plan: LessonPlan | null;
  submitAnswer: (selectedIndex: number) => void;
  submitHelp: (text: string) => void;
  advance: () => void;
  canSubmitAnswer: boolean;
  canSubmitHelp: boolean;
  isRunning: boolean;
}

interface UseCoAgentQuizReturn {
  currentObjectiveTitle: string;
  currentQuestion: PublicMCQ | null;
  questionNumber: number;
  questionCount: number;
  currentAttempt: number;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  isOptionLocked: boolean;
  isSubmitting: boolean;
  isHelpSubmitting: boolean;
  canSubmit: boolean;
  isWaitingForAnswer: boolean;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  submitHelp: (text: string) => void;
  retryQuestion: () => void;
  advance: () => void;
}

interface McqWidgetProps {
  objectiveTitle: string;
  questionNumber: number;
  questionCount: number;
  currentAttempt: number;
  question: PublicMCQ;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  isOptionLocked: boolean;
  isSubmitting?: boolean;
  isHelpSubmitting?: boolean;
  canSubmit?: boolean;
  isWaitingForAnswer?: boolean;
  helpThread?: HelpThreadMessage[];
  helpTurnsUsed?: number;
  canSubmitHelp?: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onSubmitHelp?: (text: string) => void;
  onRetry: () => void;
  onAdvance: () => void;
}

interface HelpInputProps {
  thread: HelpThreadMessage[];
  helpTurnsUsed: number;
  maxHelp: number;
  canSubmitHelp: boolean;
  isSubmitting: boolean;
  onSubmitHelp: (text: string) => void;
}

interface DisplayMessage extends HelpThreadMessage {
  key: string;
  animate?: boolean;
}

interface WidgetActionsProps {
  hasSelection: boolean;
  feedback: Feedback | null;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  isWaitingForAnswer?: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  onAdvance: () => void;
}

interface OptionListProps {
  question: PublicMCQ;
  selectedIndex: number | null;
  triedOptionIndices: number[];
  feedback: Feedback | null;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export type {
  DisplayMessage,
  HelpInputProps,
  McqWidgetProps,
  OptionListProps,
  UseCoAgentQuizOptions,
  UseCoAgentQuizReturn,
  WidgetActionsProps,
};
