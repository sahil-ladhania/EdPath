import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "tmp", "upload-smoke");

const VALID_TEXT_PDF = Buffer.from(
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

const NO_TEXT_LAYER_PDF = Buffer.from(
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

const NEAR_EMPTY_PDF = Buffer.from(
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

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(join(OUT_DIR, "valid-text.pdf"), VALID_TEXT_PDF);
writeFileSync(join(OUT_DIR, "fake.pdf"), Buffer.from("plain text file content", "utf8"));
writeFileSync(
  join(OUT_DIR, "oversized.pdf"),
  Buffer.concat([VALID_TEXT_PDF, Buffer.alloc(16 * 1024 * 1024)]),
);
writeFileSync(join(OUT_DIR, "scanned.pdf"), NO_TEXT_LAYER_PDF);
writeFileSync(join(OUT_DIR, "near-empty.pdf"), NEAR_EMPTY_PDF);

console.log(OUT_DIR);
