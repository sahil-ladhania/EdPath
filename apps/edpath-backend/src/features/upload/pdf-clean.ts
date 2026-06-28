/**
 * PDF text normalization — de-hyphenation, whitespace collapse, token estimate.
 *
 * Whole document as one string; no chunking or header/footer dedup.
 */
export function cleanPdfText(rawText: string): string {
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // De-hyphenate soft line breaks: "exam-\nple" → "example"
  text = text.replace(/(\w)-\n(\w)/g, "$1$2");

  const lines = text.split("\n").map((line) => {
    return line.replace(/[\t\f\v]+/g, " ").replace(/ +/g, " ").trimEnd();
  });

  text = lines.join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/** PROVISIONAL token estimate for upload ceiling checks (chars / 4). */
export function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}
