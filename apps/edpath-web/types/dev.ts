/**
 * Dev preview control prop types.
 */

import type { Phase } from "@repo/types";

import type { QuizPreviewOutcome } from "@/types/lesson";

interface DevPhaseSwitcherProps {
  phase: Phase;
  objectiveCount: number;
  currentObjectiveIndex: number;
  onSetPhase: (phase: Phase) => void;
  onJumpToObjective: (index: number) => void;
  onSimulateOutcome: (outcome: QuizPreviewOutcome) => void;
}

interface PreviewSurfaceOption {
  phase: Phase;
  label: string;
}

export type { DevPhaseSwitcherProps, PreviewSurfaceOption };
