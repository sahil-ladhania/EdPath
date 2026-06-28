/**
 * PDF upload pipeline — magic-byte check → extract → clean → gate by limits → typed result.
 *
 * Linear validation gauntlet upstream of the graph; pdfText never crosses HTTP.
 */
import type { PdfMeta, UploadRejectReason } from "@repo/types";

import { extractPdfText, PdfExtractionError } from "./pdf-extract.js";
import { cleanPdfText, estimateTokens } from "./pdf-clean.js";
import type {
  RejectedUploadResult,
  UploadFileInput,
  UploadLimits,
  UploadPipelineResult,
} from "./upload.types.js";

const PDF_MAGIC = "%PDF-";

function sanitizeFilename(originalname: string): string {
  const basename = originalname.split(/[/\\]/).pop() ?? originalname;
  return basename.trim() || "upload.pdf";
}

function reject(
  reason: UploadRejectReason,
  message: string,
): UploadPipelineResult {
  const uploadResult: RejectedUploadResult = {
    status: "rejected",
    reason,
    message,
  };

  return { ok: false, uploadResult };
}

function formatMegabytes(bytes: number): string {
  return String(Math.round(bytes / (1024 * 1024)));
}

function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC.length) {
    return false;
  }

  return buffer.subarray(0, PDF_MAGIC.length).toString("ascii") === PDF_MAGIC;
}

function buildPdfMeta(
  filename: string,
  pageCount: number,
  charCount: number,
): PdfMeta {
  return {
    filename,
    pageCount,
    charCount,
  };
}

export async function processUpload(
  input: UploadFileInput,
  limits: UploadLimits,
): Promise<UploadPipelineResult> {
  const filename = sanitizeFilename(input.originalname);

  // Gate: binary size ceiling
  if (input.size > limits.maxBinaryBytes) {
    return reject(
      "over_ceiling",
      `This PDF is too large for one focused lesson. Choose a file under ${formatMegabytes(limits.maxBinaryBytes)} MB.`,
    );
  }

  // Gate: PDF magic bytes (mimetype not trusted)
  if (!isPdfBuffer(input.buffer)) {
    return reject(
      "unparseable",
      "Upload a single PDF file. Other file types are rejected.",
    );
  }

  // Gate: pdf.js extraction (encrypted / corrupt → typed reject)
  let extraction: Awaited<ReturnType<typeof extractPdfText>>;

  try {
    extraction = await extractPdfText(input.buffer);
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      if (error.kind === "encrypted") {
        return reject(
          "unparseable",
          "Password-protected PDFs aren't supported. Upload an unencrypted PDF.",
        );
      }

      if (error.kind === "corrupt") {
        return reject(
          "unparseable",
          "We couldn't read this PDF. It may be corrupted or incomplete.",
        );
      }
    }

    return reject(
      "unparseable",
      "We couldn't read this PDF. It may be corrupted or incomplete.",
    );
  }

  const cleanedText = cleanPdfText(extraction.rawText);
  const charCount = cleanedText.length;
  const pageCount = extraction.pageCount;

  // Gate: page, character, and token ceilings
  if (pageCount > limits.maxPages) {
    return reject(
      "over_ceiling",
      `This PDF is too long for one focused lesson (max ~${limits.maxPages} pages).`,
    );
  }

  if (charCount > limits.maxCleanChars) {
    return reject(
      "over_ceiling",
      "This PDF has too much text for one focused lesson.",
    );
  }

  if (estimateTokens(charCount) > limits.maxTokens) {
    return reject(
      "over_ceiling",
      "This PDF has too much text for one focused lesson.",
    );
  }

  // Gate: minimum usable text (empty / scanned PDF detection)
  if (charCount < limits.minCleanChars) {
    const charsPerPage = charCount / Math.max(pageCount, 1);

    if (pageCount >= 1 && charsPerPage < limits.minCharsPerPage) {
      return reject(
        "no_text_layer",
        "This looks like a scanned or image-only PDF. Choose a PDF with selectable text.",
      );
    }

    return reject(
      "empty",
      "This PDF has no usable text. Choose a PDF with selectable text.",
    );
  }

  const pdfMeta = buildPdfMeta(filename, pageCount, charCount);

  return {
    ok: true,
    pdfText: cleanedText,
    pdfMeta,
    uploadResult: {
      status: "accepted",
      pdfMeta,
    },
  };
}
