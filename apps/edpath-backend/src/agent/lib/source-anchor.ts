/** Normalizes text for deterministic source-anchor matching (D4). */
export function normalizeForAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

/** Returns true when sourceQuote is found in pdfText after normalization. */
export function isSourceAnchored(sourceQuote: string, pdfText: string): boolean {
  const normalizedQuote = normalizeForAnchor(sourceQuote);
  const normalizedPdf = normalizeForAnchor(pdfText);

  if (normalizedQuote.length === 0) {
    return false;
  }

  return normalizedPdf.includes(normalizedQuote);
}
