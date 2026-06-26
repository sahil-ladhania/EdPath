/**
 * Minimal single-page PDF with selectable text for upload pipeline tests.
 * Text content exceeds MIN_CLEAN_CHARS (200) when repeated in the stream.
 */
export const VALID_TEXT_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 620 >>stream
BT /F1 12 Tf
72 720 Td (EdPath upload fixture paragraph one about photosynthesis and plant biology.) Tj
0 -18 Td (EdPath upload fixture paragraph two about cellular respiration and energy transfer.) Tj
0 -18 Td (EdPath upload fixture paragraph three about ecosystems biodiversity and food webs.) Tj
0 -18 Td (EdPath upload fixture paragraph four about climate patterns and atmospheric science.) Tj
0 -18 Td (EdPath upload fixture paragraph five about geology rocks minerals and earth processes.) Tj
ET
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
0000000940 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
1015
%%EOF`,
  "binary",
);

/** Same structure but with no visible text operators (simulates image-only). */
export const NO_TEXT_LAYER_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>endobj
4 0 obj<< /Length 21 >>stream
q 612 0 0 792 0 0 cm Q
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000212 00000 n 
trailer<< /Size 5 /Root 1 0 R >>
startxref
285
%%EOF`,
  "binary",
);

export const CORRUPT_PDF = Buffer.from("%PDF-1.4\nthis is not a valid pdf structure", "utf8");

export const NOT_PDF = Buffer.from("plain text file content", "utf8");
