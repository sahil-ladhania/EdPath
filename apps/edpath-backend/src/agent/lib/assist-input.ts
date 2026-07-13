/**
 * Assist firewall input builder (D4/D20).
 * Assembles firewalled context for N5 — never includes answer fields.
 */
import type { GraphState } from "../state/annotation.js";
import { MAX_HELP } from "../state/constants.js";
import type { AssistInput } from "../types/assist.types.js";

// Define the function to build the assist input
export function buildAssistInput( state: GraphState, userMessage: string ): AssistInput {
  // Get the plan from the state
  const plan = state.plan;

  // Check if the plan is not present
  if (!plan) {
    throw new Error("Plan is required for assist");
  };

  // Get the objective from the plan
  const objective = plan.objectives[state.currentObjectiveIndex];

  // Check if the objective is not present
  if (!objective) {
    throw new Error("Current objective missing for assist");
  };

  // Get the MCQ from the state
  const mcq = state.questions[state.currentQuestionIndex];

  // Check if the MCQ is not present
  if (!mcq) {
    throw new Error("Current question missing for assist");
  };

  // Return the assist input
  return {
    question: mcq.question,
    options: [...mcq.options],
    userMessage,
    pdfText: state.pdfText,
    objectiveTitle: objective.title,
    helpTurnsUsed: state.helpTurnsUsed,
    maxHelp: MAX_HELP,
  };
};

// Define the function to assert the assist firewall
export function assertAssistFirewall(input: AssistInput): void {
  // Get the JSON string of the input
  const json = JSON.stringify(input);

  // Define the forbidden keys
  const forbidden = ["correctIndex", "explanation", "hint", "sourceQuote"];

  // Iterate over the forbidden keys
  for (const key of forbidden) {
    // Check if the JSON string includes the forbidden key
    if (json.includes(`"${key}"`)) {
      // Throw an error with the forbidden key
      throw new Error(`Assist firewall violation: "${key}" in context`);
    };
  };
};