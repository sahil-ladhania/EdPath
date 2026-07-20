/**
 * pdf.js text extraction — raw text + page count from a PDF buffer.
**/

// Import Dependencies
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Define the pdf extraction result interface
export interface PdfExtractionResult {
  rawText: string;
  pageCount: number;
};

// Define the pdf extraction error kind type
export type PdfExtractionErrorKind = "encrypted" | "corrupt" | "unknown";

// Define the pdf extraction error class
export class PdfExtractionError extends Error {
  readonly kind: PdfExtractionErrorKind;

  constructor(kind: PdfExtractionErrorKind, message: string) {
    super(message);
    this.name = "PdfExtractionError";
    this.kind = kind;
  };
};

// Define the classify pdf js error function
function classifyPdfJsError(error: unknown): PdfExtractionErrorKind {
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    if ( name.includes("password") || message.includes("password") || message.includes("encrypted") ) {
      return "encrypted";
    };

    if ( name.includes("invalidpdf") || message.includes("invalid pdf") || message.includes("corrupt") ) {
      return "corrupt";
    };
  };

  return "unknown";
};

// Define the extract pdf text function
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
    };

    return {
      rawText: pageTexts.join("\n\n"),
      pageCount,
    };
  } 
  catch (error) {
    const kind = classifyPdfJsError(error);
    throw new PdfExtractionError(kind, "PDF extraction failed");
  };
};