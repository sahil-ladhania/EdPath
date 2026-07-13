import type { LastError, Phase } from "@repo/types";

// Array of generating phases
export const GENERATING_PHASES = ["planning", "quizzing"] as const satisfies readonly Phase[];

// Object of generating phase messages
const GENERATING_PHASE_MESSAGES: Record<(typeof GENERATING_PHASES)[number], string> = {
  planning: "Generating your roadmap…",
  quizzing: "Generating your questions…",
};

// Object of generating phase subtexts
const GENERATING_PHASE_SUBTEXT: Record<(typeof GENERATING_PHASES)[number], string> = {
  planning: "Reading your PDF and drafting objectives.",
  quizzing: "Creating questions for this objective.",
};


// Message for the summarizing phase
const SUMMARIZING_MESSAGE = "Generating your summary…";

// Subtext for the summarizing phase
const SUMMARIZING_SUBTEXT = "Calculating your score and study tips…";

// Function to check if the phase is a generating phase
function isGeneratingPhaseValue( phase: Phase ): phase is (typeof GENERATING_PHASES)[number] {
  return (GENERATING_PHASES as readonly Phase[]).includes(phase);
};

// Function to check if the phase is a summarizing transition
export function isSummarizingTransition(state: { phase: Phase; questions: unknown[]; summary: unknown; plan: { objectives: unknown[] } | null; currentObjectiveIndex: number; }): boolean {
  // Return true if the phase is a summarizing transition
  return (
    state.phase === "quizzing" &&
    state.summary === null &&
    state.questions.length > 0 &&
    state.plan !== null &&
    state.currentObjectiveIndex >= state.plan.objectives.length - 1
  );
};

// Function to get the summarizing message
export function getSummarizingMessage(): string {
  // Return the summarizing message
  return SUMMARIZING_MESSAGE;
};

// Function to get the summarizing subtext
export function getSummarizingSubtext(): string {
  // Return the summarizing subtext
  return SUMMARIZING_SUBTEXT;
};

// Function to check if the phase is a generating phase
export function isGeneratingPhase(phase: Phase): boolean {
  // Return true if the phase is a generating phase
  return isGeneratingPhaseValue(phase);
};

// Function to get the generating phase message
export function getGeneratingPhaseMessage(phase: Phase): string | undefined {
  // Check if the phase is a generating phase
  if (!isGeneratingPhaseValue(phase)) {
    return undefined;
  };

  // Return the generating phase message
  return GENERATING_PHASE_MESSAGES[phase];
};

// Function to get the generating phase subtext
export function getGeneratingPhaseSubtext(phase: Phase): string | undefined {
  // Check if the phase is a generating phase
  if (!isGeneratingPhaseValue(phase)) {
    return undefined;
  };

  // Return the generating phase subtext
  return GENERATING_PHASE_SUBTEXT[phase];
};

// Function to check if the lesson is a generation error
export function isLessonGenerationError(state: { phase: Phase; questions: unknown[]; lastError: LastError | null; }): boolean {
  // Return true if the lesson is a generation error
  return (
    state.lastError !== null &&
    state.questions.length === 0 &&
    (state.phase === "quizzing" ||
      state.phase === "planning" ||
      (state.phase === "awaiting_input" && state.lastError.node === "generate_mcq"))
  );
};

// Function to resolve the lesson phase
export function resolveLessonPhase(state: { phase: Phase; plan: { objectives: unknown[] } | null; questions: unknown[]; }): Phase {
  // Check if the lesson is a generation error
  if (isLessonGenerationError(state)) {
    return state.phase;
  };

  // Check if the phase is a generating phase
  if (isGeneratingPhase(state.phase)) {
    return state.phase;
  };

  // Check if the plan is null and the phase is not complete
  if (state.plan === null && state.phase !== "complete") {
    return "planning";
  };

  // Check if the phase is a quizzing phase or an awaiting input phase with no questions
  if ( state.phase === "quizzing" || (state.phase === "awaiting_input" && state.questions.length === 0) ) {
    return "quizzing";
  };

  // Return the phase
  return state.phase;
};

// Function to get the lesson error title
export function getLessonErrorTitle(lastError: LastError): string {
  // Check if the last error is a generate MCQ error
  if (lastError.node === "generate_mcq") {
    // Return the lesson error title
    return "Couldn't generate questions";
  };

  // Check if the last error is a plan error
  if (lastError.node === "plan") {
    // Return the lesson error title
    return "Couldn't build your lesson path";
  };

  // Return the lesson error title
  return "Something went wrong";
};