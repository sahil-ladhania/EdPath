/**
 * UI surface selector (§5.1 `phase`). Pure compile-time union — never validated
 * on its own; after a refresh it drives which surface re-renders (F11.3):
 * `awaiting_approval` → plan, `awaiting_input` → MCQ card, `complete` → summary.
 */
export type Phase =
  | "planning"
  | "awaiting_approval"
  | "quizzing"
  | "awaiting_input"
  | "complete";
