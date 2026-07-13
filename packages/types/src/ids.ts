/**
 * Stable ID aliases threading plan → questions → results → summary (Gate 5 "stable IDs"). 
 * Documentation-only aliases — plain strings, no branding in v1; the schemas validate these as `z.string()` (Flag 4).
**/
// Define the objective id type
export type ObjectiveId = string;

// Define the question id type
export type QuestionId = string;