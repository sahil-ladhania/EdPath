/*
    * Constants for the backend graph.
*/
// Export the max attempts and max help constants from the schemas
export { MAX_ATTEMPTS, MAX_HELP } from "@repo/schemas/constants";

// Define the mcqs per objective constant
export const MCQS_PER_OBJECTIVE = 3;

// Define the max objectives in a plan constant
export const MAX_OBJECTIVES = 8;

// Define the max repair retries per generative node constant
export const MAX_REPAIR = 2;

// Define the per-run aggregate token ceiling constant
export const TOKEN_CEILING = 1_500_000;

// Define the max input tokens constant
export const MAX_INPUT_TOKENS = 100_000;

// Define the max output tokens constant
export const MAX_OUTPUT_TOKENS = 8_000;