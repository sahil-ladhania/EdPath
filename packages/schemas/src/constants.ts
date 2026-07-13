/*
    * Quiz-loop bounds shared by both ends: the backend graph enforces them while the web UI mirrors them for the attempt/help counters. 
    * Defined once here so the value cannot drift between front and back.
*/

// Define the max attempts constant
export const MAX_ATTEMPTS = 3;

// Define the max help constant
export const MAX_HELP = 3;