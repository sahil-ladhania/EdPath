import { describe, expect, test } from "vitest";

import { buildInitialEdPathState } from "./build-initial-state.js";
import { cleanPdfText, estimateTokens } from "./pdf-clean.js";
import { extractPdfText } from "./pdf-extract.js";
import { processUpload } from "./upload.service.js";
import type { UploadLimits } from "./upload.types.js";
import {
  CORRUPT_PDF,
  NO_TEXT_LAYER_PDF,
  NOT_PDF,
  VALID_TEXT_PDF,
} from "./test-fixtures.js";

const DEFAULT_LIMITS: UploadLimits = {
  maxBinaryBytes: 15 * 1024 * 1024,
  maxCleanChars: 200_000,
  maxTokens: 50_000,
  maxPages: 50,
  minCleanChars: 200,
  minCharsPerPage: 30,
};

describe("cleanPdfText", () => {
  test("normalizes whitespace and de-hyphenates soft breaks", () => {
    const raw = "Hello   world\r\n\r\n\r\nFoo-\nbar\t\tbaz";
    expect(cleanPdfText(raw)).toBe("Hello world\n\nFoobar baz");
  });
});

describe("estimateTokens", () => {
  test("uses chars / 4 ceiling", () => {
    expect(estimateTokens(0)).toBe(0);
    expect(estimateTokens(5)).toBe(2);
    expect(estimateTokens(200_000)).toBe(50_000);
  });
});

describe("extractPdfText", () => {
  test("extracts text from a valid fixture PDF", async () => {
    const result = await extractPdfText(VALID_TEXT_PDF);

    expect(result.pageCount).toBe(1);
    expect(result.rawText).toContain("photosynthesis");
    expect(result.rawText.length).toBeGreaterThan(200);
  });
});

describe("processUpload", () => {
  test("accepts a valid text-layer PDF", async () => {
    const result = await processUpload(
      {
        buffer: VALID_TEXT_PDF,
        originalname: "lesson-source.pdf",
        mimetype: "application/pdf",
        size: VALID_TEXT_PDF.length,
      },
      DEFAULT_LIMITS,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.uploadResult.status).toBe("accepted");
    expect(result.pdfMeta.filename).toBe("lesson-source.pdf");
    expect(result.pdfMeta.pageCount).toBe(1);
    expect(result.pdfMeta.charCount).toBeGreaterThanOrEqual(200);
    expect(result.pdfText.length).toBe(result.pdfMeta.charCount);
  });

  test("rejects non-PDF files as unparseable", async () => {
    const result = await processUpload(
      {
        buffer: NOT_PDF,
        originalname: "notes.txt",
        mimetype: "text/plain",
        size: NOT_PDF.length,
      },
      DEFAULT_LIMITS,
    );

    expect(result).toEqual({
      ok: false,
      uploadResult: {
        status: "rejected",
        reason: "unparseable",
        message: "Upload a single PDF file. Other file types are rejected.",
      },
    });
  });

  test("rejects corrupt PDFs as unparseable", async () => {
    const result = await processUpload(
      {
        buffer: CORRUPT_PDF,
        originalname: "broken.pdf",
        mimetype: "application/pdf",
        size: CORRUPT_PDF.length,
      },
      DEFAULT_LIMITS,
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.uploadResult.status).toBe("rejected");
    expect(result.uploadResult.reason).toBe("unparseable");
  });

  test("rejects image-only PDFs as no_text_layer", async () => {
    const result = await processUpload(
      {
        buffer: NO_TEXT_LAYER_PDF,
        originalname: "scan.pdf",
        mimetype: "application/pdf",
        size: NO_TEXT_LAYER_PDF.length,
      },
      DEFAULT_LIMITS,
    );

    expect(result).toEqual({
      ok: false,
      uploadResult: {
        status: "rejected",
        reason: "no_text_layer",
        message:
          "This looks like a scanned or image-only PDF. Choose a PDF with selectable text.",
      },
    });
  });

  test("rejects oversize binary as over_ceiling", async () => {
    const result = await processUpload(
      {
        buffer: VALID_TEXT_PDF,
        originalname: "large.pdf",
        mimetype: "application/pdf",
        size: VALID_TEXT_PDF.length,
      },
      {
        ...DEFAULT_LIMITS,
        maxBinaryBytes: 10,
      },
    );

    expect(result).toEqual({
      ok: false,
      uploadResult: {
        status: "rejected",
        reason: "over_ceiling",
        message:
          "This PDF is too large for one focused lesson. Choose a file under 0 MB.",
      },
    });
  });

  test("rejects extracted text above clean char ceiling", async () => {
    const result = await processUpload(
      {
        buffer: VALID_TEXT_PDF,
        originalname: "long.pdf",
        mimetype: "application/pdf",
        size: VALID_TEXT_PDF.length,
      },
      {
        ...DEFAULT_LIMITS,
        maxCleanChars: 50,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.uploadResult.reason).toBe("over_ceiling");
    expect(result.uploadResult.message).toBe(
      "This PDF has too much text for one focused lesson.",
    );
  });

  test("rejects near-empty text as empty when per-page density is sufficient", async () => {
    const shortTextPdf = Buffer.from(
      `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 260 >>stream
BT /F1 12 Tf 72 720 Td (This single-page PDF has enough per-page density but still falls below the minimum cleaned character threshold for acceptance.) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000580 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
655
%%EOF`,
      "binary",
    );

    const result = await processUpload(
      {
        buffer: shortTextPdf,
        originalname: "short.pdf",
        mimetype: "application/pdf",
        size: shortTextPdf.length,
      },
      DEFAULT_LIMITS,
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.uploadResult.reason).toBe("empty");
    expect(result.uploadResult.message).toBe(
      "This PDF has no usable text. Choose a PDF with selectable text.",
    );
  });
});

describe("buildInitialEdPathState", () => {
  test("seeds graph state from accepted upload output", () => {
    const seed = buildInitialEdPathState({
      pdfText: "Grounding text",
      pdfMeta: {
        filename: "lesson.pdf",
        charCount: 14,
        pageCount: 1,
      },
    });

    expect(seed.pdfText).toBe("Grounding text");
    expect(seed.pdfMeta.filename).toBe("lesson.pdf");
    expect(seed.phase).toBe("planning");
    expect(seed.plan).toBeNull();
    expect(seed.questions).toEqual([]);
  });
});
