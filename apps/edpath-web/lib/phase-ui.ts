import type { LastError, Phase } from "@repo/types";

export const GENERATING_PHASES = ["planning", "quizzing"] as const satisfies readonly Phase[];

const GENERATING_PHASE_MESSAGES: Record<
  (typeof GENERATING_PHASES)[number],
  string
> = {
  planning: "Generating your roadmap…",
  quizzing: "Generating your questions…",
};

const GENERATING_PHASE_SUBTEXT: Record<
  (typeof GENERATING_PHASES)[number],
  string
> = {
  planning: "Reading your PDF and drafting objectives.",
  quizzing: "Creating questions for this objective.",
};

function isGeneratingPhaseValue(
  phase: Phase,
): phase is (typeof GENERATING_PHASES)[number] {
  return (GENERATING_PHASES as readonly Phase[]).includes(phase);
}

export function isGeneratingPhase(phase: Phase): boolean {
  return isGeneratingPhaseValue(phase);
}

export function getGeneratingPhaseMessage(phase: Phase): string | undefined {
  if (!isGeneratingPhaseValue(phase)) {
    return undefined;
  }

  return GENERATING_PHASE_MESSAGES[phase];
}

export function getGeneratingPhaseSubtext(phase: Phase): string | undefined {
  if (!isGeneratingPhaseValue(phase)) {
    return undefined;
  }

  return GENERATING_PHASE_SUBTEXT[phase];
}

/** True when generation failed and the UI should show an error, not a spinner. */
export function isLessonGenerationError(state: {
  phase: Phase;
  questions: unknown[];
  lastError: LastError | null;
}): boolean {
  return (
    state.lastError !== null &&
    state.questions.length === 0 &&
    (state.phase === "quizzing" ||
      state.phase === "planning" ||
      (state.phase === "awaiting_input" && state.lastError.node === "generate_mcq"))
  );
}

/** UI phase: keep generating surfaces until plan/questions are actually present. */
export function resolveLessonPhase(state: {
  phase: Phase;
  plan: { objectives: unknown[] } | null;
  questions: unknown[];
  lastError: LastError | null;
}): Phase {
  if (isLessonGenerationError(state)) {
    return state.phase;
  }

  if (isGeneratingPhase(state.phase)) {
    return state.phase;
  }

  if (state.plan === null && state.phase !== "complete") {
    return "planning";
  }

  if (
    state.phase === "quizzing" ||
    (state.phase === "awaiting_input" && state.questions.length === 0)
  ) {
    return "quizzing";
  }

  return state.phase;
}

export function getLessonErrorTitle(lastError: LastError): string {
  if (lastError.node === "generate_mcq") {
    return "Couldn't generate questions";
  }

  if (lastError.node === "plan") {
    return "Couldn't build your lesson path";
  }

  return "Something went wrong";
}

/**
 * Usage (LessonRunner — real CoAgent phase only, not useLesson mock phase):
 *
 * ```tsx
 * import { GeneratingPanel } from "@/components/ui/GeneratingPanel";
 * import {
 *   getGeneratingPhaseMessage,
 *   getGeneratingPhaseSubtext,
 *   isGeneratingPhase,
 *   resolveLessonPhase,
 * } from "@/lib/phase-ui";
 *
 * const phase = resolveLessonPhase(coAgentLesson.state);
 *
 * <ObjectiveRail isGenerating={isGeneratingPhase(phase)} … />
 * {isGeneratingPhase(phase) ? (
 *   <GeneratingPanel
 *     message={getGeneratingPhaseMessage(phase) ?? "Generating your roadmap…"}
 *     subtext={getGeneratingPhaseSubtext(phase)}
 *   />
 * ) : null}
 * {phase === "awaiting_approval" && plan ? <PlanWidget … /> : null}
 * ```
 *
 * Drive visibility from mirrored agent state only — never from mock timers,
 * `setTimeout`, or CopilotKit transport flags (`running` / `isLoading`).
 */
