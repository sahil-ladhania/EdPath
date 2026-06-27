/**
 * Shell layout prop types.
 */

import type { LastError, Objective, Phase } from "@repo/types";

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
}

interface LessonErrorBannerProps {
  lastError: LastError;
  title?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export type { LessonErrorBannerProps, ObjectiveRailProps };
