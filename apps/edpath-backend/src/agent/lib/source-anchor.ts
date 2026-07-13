/**
 * Source-anchor grounding (D4) — verifies MCQ sourceQuote against pdfText.
 * Token-exact window matching; used by generate_mcq before accepting a batch.
**/

// Define the function to normalize the text for the anchor
export function normalizeForAnchor(text: string): string {
  // Return the normalized text
  return text
    // Convert the text to lowercase
    .toLowerCase()
    // Replace multiple spaces with a single space
    .replace(/\s+/g, " ")
    // Replace non-word and non-space characters with an empty string
    .replace(/[^\w\s]/g, "")
    // Trim the text
    .trim();
};

// Define the minimum anchor tokens
const MIN_ANCHOR_TOKENS = 8;

// Define the function to tokenize the text
export function tokenize(text: string): string[] {
  // Normalize the text
  const normalized = normalizeForAnchor(text);

  // Return the tokens
  return normalized.length === 0 ? [] : normalized.split(" ");
};

// Define the function to check if the window contains a run
function containsRun(tokens: string[], window: string[]): boolean {
  // Check if the window is empty or longer than the tokens
  if (window.length === 0 || window.length > tokens.length) {
    return false;
  };

  // Iterate over the tokens
  for (let start = 0; start + window.length <= tokens.length; start++) {
    // Check if the matched is true
    let matched = true;

    // Iterate over the window
    for (let offset = 0; offset < window.length; offset++) {
      // Check if the token does not match the window
      if (tokens[start + offset] !== window[offset]) {
        // Set the matched to false
        matched = false;

        // Break out of the loop
        break;
      };
    };
    
    // Check if the matched is true
    if (matched) {
      // Return the true
      return true;
    };
  };

  // Return the false
  return false;
};

// Define the function to check if the source is anchored
export function isSourceAnchored(sourceQuote: string, pdfText: string): boolean {
  // Tokenize the source quote
  const quoteTokens = tokenize(sourceQuote);

  // Tokenize the PDF text
  const pdfTokens = tokenize(pdfText);

  // Check if the quote tokens is empty
  if (quoteTokens.length === 0) {
    return false;
  };

  // Get the window size
  const windowSize = Math.min(MIN_ANCHOR_TOKENS, quoteTokens.length);

  // Iterate over the quote tokens
  for (let start = 0; start + windowSize <= quoteTokens.length; start++) {
    // Get the window
    const window = quoteTokens.slice(start, start + windowSize);

    // Check if the window contains a run
    if (containsRun(pdfTokens, window)) {
      return true;
    };
  };

  return false;
};