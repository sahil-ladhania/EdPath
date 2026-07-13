import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Function to merge class values
export function cn(...inputs: ClassValue[]) {
  // Return the merged class values
  return twMerge(clsx(inputs));
};