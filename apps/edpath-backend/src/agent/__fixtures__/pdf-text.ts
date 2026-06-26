import type { PdfMeta } from "@repo/types";

/** Short grounded PDF text for agent tests. */
export const FIXTURE_PDF_TEXT = `
Photosynthesis is the process by which green plants convert light energy into chemical energy.
Chlorophyll in chloroplasts absorbs sunlight and drives the synthesis of glucose from carbon dioxide and water.
Cellular respiration occurs in mitochondria and releases energy stored in glucose for use by the cell.
The cell membrane is selectively permeable and regulates the transport of materials into and out of the cell.
The nucleus contains genetic material and acts as the control center of the cell.
Mitosis is the process of cell division that produces two identical daughter cells for growth and repair.
`.trim();

export const FIXTURE_PDF_META: PdfMeta = {
  filename: "photosynthesis-fixture.pdf",
  charCount: FIXTURE_PDF_TEXT.length,
  pageCount: 1,
};

export const FIXTURE_SOURCE_QUOTE =
  "Chlorophyll in chloroplasts absorbs sunlight and drives the synthesis of glucose";
