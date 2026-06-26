import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PdfExtractionResult {
  rawText: string;
  pageCount: number;
}

export type PdfExtractionErrorKind = "encrypted" | "corrupt" | "unknown";

export class PdfExtractionError extends Error {
  readonly kind: PdfExtractionErrorKind;

  constructor(kind: PdfExtractionErrorKind, message: string) {
    super(message);
    this.name = "PdfExtractionError";
    this.kind = kind;
  }
}

function classifyPdfJsError(error: unknown): PdfExtractionErrorKind {
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    if (
      name.includes("password") ||
      message.includes("password") ||
      message.includes("encrypted")
    ) {
      return "encrypted";
    }

    if (
      name.includes("invalidpdf") ||
      message.includes("invalid pdf") ||
      message.includes("corrupt")
    ) {
      return "corrupt";
    }
  }

  return "unknown";
}

export async function extractPdfText(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if ("str" in item && typeof item.str === "string") {
            return item.str;
          }
          return "";
        })
        .join(" ")
        .trim();

      pageTexts.push(pageText);
    }

    return {
      rawText: pageTexts.join("\n\n"),
      pageCount,
    };
  } catch (error) {
    const kind = classifyPdfJsError(error);
    throw new PdfExtractionError(kind, "PDF extraction failed");
  }
}
