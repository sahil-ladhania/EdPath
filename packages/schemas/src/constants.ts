// Quiz-loop bounds shared by both ends: the backend graph enforces them while
// the web UI mirrors them for the attempt/help counters. Defined once here so
// the value cannot drift between front and back.

/** Max attempts per question: initial + 2 retries (B2). */
export const MAX_ATTEMPTS = 3;

/** Max help turns per question (B3). */
export const MAX_HELP = 3;
