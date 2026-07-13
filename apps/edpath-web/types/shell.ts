// Types for the shell layout prop types
import type { LastError, Objective, Phase } from "@repo/types";

// Interface for the objective rail props
interface ObjectiveRailProps {
  objectives: Objective[];
  currentObjectiveIndex: number;
  phase: Phase;
  currentQuestionIndex?: number;
  questionCount?: number;
  isGenerating?: boolean;
  hasGenerationError?: boolean;
  generatingMessage?: string;
  generatingSubtext?: string;
};

// Interface for the lesson error banner props
interface LessonErrorBannerProps {
  lastError: LastError;
  title?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

// Export the types 
export type { LessonErrorBannerProps, ObjectiveRailProps };