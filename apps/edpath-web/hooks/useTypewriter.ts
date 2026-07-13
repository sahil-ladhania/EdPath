"use client";

// Import React hooks and types
import { useEffect, useState } from "react";

// Constant for the typewriter milliseconds
const TYPEWRITER_MS = 16;

// Function to use the typewriter
export function useTypewriter( text: string, enabled: boolean, onComplete?: () => void ): string {
  // useState Hook to store the visible text
  const [visible, setVisible] = useState<string>(enabled ? "" : text);

  // useEffect Hook to check if the enabled state is false
  useEffect(() => {
    // Check if the enabled state is false
    if (!enabled) {
      // Set the visible text to the full text
      setVisible(text);
      return;
    };

    // Set the visible text to an empty string
    setVisible("");
    // Initialize the index
    let index = 0;

    // Set the timer
    const timer = window.setInterval(() => {
      // Increment the index
      index += 1;
      // Set the visible text to the sliced text
      setVisible(text.slice(0, index));
      // Check if the index is greater than or equal to the text length
      if (index >= text.length) {
        // Clear the timer
        window.clearInterval(timer);
        // Call the on complete function
        onComplete?.();
      };
    }, TYPEWRITER_MS);

    // Return a function to clear the timer
    return () => window.clearInterval(timer);
  }, [enabled, onComplete, text]);

  return visible;
};