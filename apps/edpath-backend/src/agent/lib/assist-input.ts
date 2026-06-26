import type { GraphState } from "../state/annotation.js";
import { MAX_HELP } from "../state/constants.js";
import type { AssistInput } from "../types/assist.types.js";

/** Builds firewalled assist context — never includes answer fields (D4/D20). */
export function buildAssistInput(
  state: GraphState,
  userMessage: string,
): AssistInput {
  const plan = state.plan;
  if (!plan) {
    throw new Error("Plan is required for assist");
  }

  const objective = plan.objectives[state.currentObjectiveIndex];
  if (!objective) {
    throw new Error("Current objective missing for assist");
  }

  const mcq = state.questions[state.currentQuestionIndex];
  if (!mcq) {
    throw new Error("Current question missing for assist");
  }

  return {
    question: mcq.question,
    options: [...mcq.options],
    userMessage,
    pdfText: state.pdfText,
    objectiveTitle: objective.title,
    helpTurnsUsed: state.helpTurnsUsed,
    maxHelp: MAX_HELP,
  };
}

/** Runtime guard: assist input must not carry firewalled keys. */
export function assertAssistFirewall(input: AssistInput): void {
  const json = JSON.stringify(input);
  const forbidden = ["correctIndex", "explanation", "hint", "sourceQuote"];
  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Assist firewall violation: "${key}" in context`);
    }
  }
}
