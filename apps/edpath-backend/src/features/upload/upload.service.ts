/**
 * PDF upload pipeline — magic-byte check → extract → clean → gate by limits → typed result.
 * Linear validation gauntlet upstream of the graph; pdfText never crosses HTTP.
**/
import type { PdfMeta, UploadRejectReason } from "@repo/types";
import { extractPdfText, PdfExtractionError } from "./pdf-extract.js";
import { cleanPdfText, estimateTokens } from "./pdf-clean.js";
import type { RejectedUploadResult, UploadFileInput, UploadLimits, UploadPipelineResult } from "./upload.types.js";

// Define the PDF magic bytes
const PDF_MAGIC = "%PDF-";

// Define the sanitize filename function
function sanitizeFilename(originalname: string): string {
  // Get the basename of the original filename
  const basename = originalname.split(/[/\\]/).pop() ?? originalname;
  
  // Return the basename trimmed or "upload.pdf"
  return basename.trim() || "upload.pdf";
};

// Define the reject function
function reject( reason: UploadRejectReason, message: string ): UploadPipelineResult {
  // Create the rejected upload result
  const uploadResult: RejectedUploadResult = {
    status: "rejected",
    reason,
    message,
  };

  // Return the rejected upload result
  return { ok: false, uploadResult };
};

// Define the format megabytes function
function formatMegabytes(bytes: number): string {
  // Return the bytes formatted as megabytes
  return String(Math.round(bytes / (1024 * 1024)));
};

// Define the is pdf buffer function
function isPdfBuffer(buffer: Buffer): boolean {
  // Check if the buffer is less than the PDF magic bytes length
  if (buffer.length < PDF_MAGIC.length) {
    return false;
  };

  // Check if the buffer subarray is equal to the PDF magic bytes
  return buffer.subarray(0, PDF_MAGIC.length).toString("ascii") === PDF_MAGIC;
};

// Define the build pdf meta function
function buildPdfMeta( filename: string, pageCount: number, charCount: number ): PdfMeta {
  // Return the pdf meta
  return {
    filename,
    pageCount,
    charCount,
  };
};

// Define the process upload function
export async function processUpload( input: UploadFileInput, limits: UploadLimits ): Promise<UploadPipelineResult> {
  // Sanitize the filename
  const filename = sanitizeFilename(input.originalname);

  // Check if the input size is greater than the max binary bytes
  if (input.size > limits.maxBinaryBytes) {
    return reject(
      "over_ceiling",
      `This PDF is too large for one focused lesson. Choose a file under ${formatMegabytes(limits.maxBinaryBytes)} MB.`,
    );
  };

  // Check if the input buffer is a PDF buffer
  if (!isPdfBuffer(input.buffer)) {
    return reject(
      "unparseable",
      "Upload a single PDF file. Other file types are rejected.",
    );
  };

  // Extract the PDF text
  let extraction: Awaited<ReturnType<typeof extractPdfText>>;

  try {
    extraction = await extractPdfText(input.buffer);
  } 
  catch (error) {
    // Check if the error is a PDF extraction error
    if (error instanceof PdfExtractionError) {
      // Check if the error is an encrypted error
      if (error.kind === "encrypted") {
        return reject(
          "unparseable",
          "Password-protected PDFs aren't supported. Upload an unencrypted PDF.",
        );
      };

      // Check if the error is a corrupt error
      if (error.kind === "corrupt") {
        return reject(
          "unparseable",
          "We couldn't read this PDF. It may be corrupted or incomplete.",
        );
      };
    };

    // Return the unparseable error
    return reject(
      "unparseable",
      "We couldn't read this PDF. It may be corrupted or incomplete.",
    );
  };

  // Clean the PDF text
  const cleanedText = cleanPdfText(extraction.rawText);

  // Get the character count
  const charCount = cleanedText.length;

  // Get the page count
  const pageCount = extraction.pageCount;

  // Check if the page count is greater than the max pages
  if (pageCount > limits.maxPages) {
    return reject(
      "over_ceiling",
      `This PDF is too long for one focused lesson (max ~${limits.maxPages} pages).`,
    );
  };

  // Check if the character count is greater than the max clean chars
  if (charCount > limits.maxCleanChars) {
    return reject(
      "over_ceiling",
      "This PDF has too much text for one focused lesson.",
    );
  };

  // Check if the estimated tokens are greater than the max tokens
  if (estimateTokens(charCount) > limits.maxTokens) {
    return reject(
      "over_ceiling",
      "This PDF has too much text for one focused lesson.",
    );
  };

  // Check if the character count is less than the min clean chars
  if (charCount < limits.minCleanChars) {
    const charsPerPage = charCount / Math.max(pageCount, 1);

    // Check if the page count is greater than or equal to 1 and the characters per page is less than the min chars per page
    if (pageCount >= 1 && charsPerPage < limits.minCharsPerPage) {
      return reject(
        "no_text_layer",
        "This looks like a scanned or image-only PDF. Choose a PDF with selectable text.",
      );
    };

    // Return the empty error
    return reject(
      "empty",
      "This PDF has no usable text. Choose a PDF with selectable text.",
    );
  };

  // Build the PDF meta
  const pdfMeta = buildPdfMeta(filename, pageCount, charCount);

  // Return the accepted upload result
  return {
    ok: true,
    pdfText: cleanedText,
    pdfMeta,
    uploadResult: {
      status: "accepted",
      pdfMeta,
    },
  };
};