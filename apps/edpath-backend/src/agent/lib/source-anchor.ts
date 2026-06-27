/** Normalizes text for deterministic source-anchor matching (D4). */
export function normalizeForAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Minimum contiguous verbatim run (in words) that proves a quote is grounded.
 * Eight consecutive words copied from the PDF is strong, hard-to-coincide
 * evidence of provenance — while tolerating a stray word the model adds or
 * alters at the edge of an otherwise-verbatim span (the common LLM drift that
 * a strict full-substring check rejects).
 */
const MIN_ANCHOR_TOKENS = 8;

function tokenize(text: string): string[] {
  const normalized = normalizeForAnchor(text);
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** True when `window` appears as a contiguous run within `tokens`. */
function containsRun(tokens: string[], window: string[]): boolean {
  if (window.length === 0 || window.length > tokens.length) {
    return false;
  }

  for (let start = 0; start + window.length <= tokens.length; start++) {
    let matched = true;
    for (let offset = 0; offset < window.length; offset++) {
      if (tokens[start + offset] !== window[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true when `sourceQuote` is grounded in `pdfText` (D4). A quote of at
 * least `MIN_ANCHOR_TOKENS` words passes when ANY contiguous window of that many
 * words is present verbatim in the PDF; a shorter quote must appear in full as a
 * contiguous run. Matching is token-exact (not raw substring) so partial-word
 * overlaps cannot produce false positives.
 */
export function isSourceAnchored(sourceQuote: string, pdfText: string): boolean {
  const quoteTokens = tokenize(sourceQuote);
  const pdfTokens = tokenize(pdfText);

  if (quoteTokens.length === 0) {
    return false;
  }

  const windowSize = Math.min(MIN_ANCHOR_TOKENS, quoteTokens.length);

  for (let start = 0; start + windowSize <= quoteTokens.length; start++) {
    const window = quoteTokens.slice(start, start + windowSize);
    if (containsRun(pdfTokens, window)) {
      return true;
    }
  }

  return false;
}
