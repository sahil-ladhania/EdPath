/** Firewalled context for N5 assist — no answer fields (D4/D20). */
export interface AssistInput {
  question: string;
  options: string[];
  userMessage: string;
  pdfText: string;
  objectiveTitle: string;
  helpTurnsUsed: number;
  maxHelp: number;
}
