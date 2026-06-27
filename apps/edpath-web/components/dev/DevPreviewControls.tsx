"use client";

import type { Phase } from "@repo/types";

import { DevPhaseSwitcher } from "@/components/dev/DevPhaseSwitcher";
import { useLesson } from "@/hooks/useLesson";

interface DevPreviewControlsProps {
  threadId: string;
  /** Real, resolved CoAgent phase (display/highlight only). */
  phase: Phase;
  /** Real CoAgent objective index (display/highlight only). */
  currentObjectiveIndex: number;
}

/**
 * Dev-only wrapper that owns the mock `useLesson` state machine driving the
 * Preview Controls panel. Gated behind `NEXT_PUBLIC_EDPATH_DEV_PREVIEW` at the
 * call site (`LessonRunner`): when the flag is off this component is never
 * mounted, so `useLesson` — and every mock mutator/timer it owns — never runs.
 * That keeps the real lesson flow purely on real agent state.
 */
export function DevPreviewControls({
  threadId,
  phase,
  currentObjectiveIndex,
}: DevPreviewControlsProps) {
  const lesson = useLesson(threadId);

  return (
    <DevPhaseSwitcher
      phase={phase}
      objectiveCount={lesson.plan.objectives.length}
      currentObjectiveIndex={currentObjectiveIndex}
      onSetPhase={lesson.setPhase}
      onJumpToObjective={lesson.jumpToObjective}
      onSimulateOutcome={lesson.simulateOutcome}
    />
  );
}
