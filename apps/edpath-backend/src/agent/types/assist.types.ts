/** Agent-local assist side-channel contracts (N5) — no answer fields. */
export interface AssistInput {
  question: string;
  options: string[];
  userMessage: string;
  pdfText: string;
  objectiveTitle: string;
  helpTurnsUsed: number;
  maxHelp: number;
}
