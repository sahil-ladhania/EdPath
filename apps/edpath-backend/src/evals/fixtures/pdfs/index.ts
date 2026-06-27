import type { PdfMeta } from "@repo/types";

import {
  FIXTURE_PDF_META,
  FIXTURE_PDF_TEXT,
} from "../../../agent/__fixtures__/pdf-text.js";

import type { EvalPdfFixture } from "../../types.js";

/** Easy fixture — photosynthesis basics (existing test PDF). */
export const EASY_PDF: EvalPdfFixture = {
  text: FIXTURE_PDF_TEXT,
  meta: FIXTURE_PDF_META,
};

/** Dense multi-topic academic excerpt. */
export const DENSE_PDF_TEXT = `
The Krebs cycle, also known as the citric acid cycle, occurs in the mitochondrial matrix.
Acetyl-CoA combines with oxaloacetate to form citrate, which is then oxidized to regenerate oxaloacetate.
ATP synthase uses the proton gradient across the inner mitochondrial membrane to phosphorylate ADP into ATP.
DNA replication is semiconservative: each new double helix contains one original strand and one newly synthesized strand.
RNA polymerase binds to the promoter region and synthesizes mRNA in the 5 prime to 3 prime direction.
Ribosomes translate mRNA codons into polypeptide chains using tRNA anticodons.
Enzymes lower activation energy by stabilizing the transition state without being consumed in the reaction.
Competitive inhibitors bind the active site and can be overcome by increasing substrate concentration.
Photosynthesis converts light energy into chemical energy in chloroplasts using chlorophyll pigments.
Cellular respiration releases stored glucose energy through glycolysis, the Krebs cycle, and oxidative phosphorylation.
`.trim();

export const DENSE_PDF: EvalPdfFixture = {
  text: DENSE_PDF_TEXT,
  meta: {
    filename: "cell-biology-dense.pdf",
    charCount: DENSE_PDF_TEXT.length,
    pageCount: 3,
  },
};

/** Messy PDF — abbreviated bullets and noisy whitespace. */
export const MESSY_PDF_TEXT = `
  PHOTOSYNTHESIS   basics


•   light  →  chemical energy
• chlorophyll   in chloroplasts
•  CO2  +  H2O  →  glucose


   RESPIRATION:
mitochondria... releases energy from glucose


CELL MEMBRANE - selective permeability
`.trim();

export const MESSY_PDF: EvalPdfFixture = {
  text: MESSY_PDF_TEXT,
  meta: {
    filename: "messy-notes.pdf",
    charCount: MESSY_PDF_TEXT.length,
    pageCount: 1,
  },
};

/** Minimal PDF — three sentences only. */
export const MINIMAL_PDF_TEXT = `
Water freezes at zero degrees Celsius under standard pressure.
Ice expands because hydrogen bonds create an open crystal lattice.
Salt lowers the freezing point of water through freezing point depression.
`.trim();

export const MINIMAL_PDF: EvalPdfFixture = {
  text: MINIMAL_PDF_TEXT,
  meta: {
    filename: "minimal-freezing.pdf",
    charCount: MINIMAL_PDF_TEXT.length,
    pageCount: 1,
  },
};

export function createPdfMeta(filename: string, text: string): PdfMeta {
  return {
    filename,
    charCount: text.length,
    pageCount: 1,
  };
}
