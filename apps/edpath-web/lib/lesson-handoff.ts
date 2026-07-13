
// Key for the last thread ID
export const EDPATH_LAST_THREAD_ID_KEY = "edpath:lastThreadId";

// Function to create a new thread ID
export function createThreadId(): string {
  return crypto.randomUUID();
};

// Function to remember the thread ID
export function rememberThreadId(threadId: string): void {
  try {
    // Set the thread ID in localStorage
    localStorage.setItem(EDPATH_LAST_THREAD_ID_KEY, threadId);
  } 
  catch {
    // Private mode or storage blocked - URL remains authoritative.
  }
};