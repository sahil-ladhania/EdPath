/**
 * Source anchor test suite.
 */
import { describe, expect, test } from "vitest";
import { FIXTURE_PDF_TEXT } from "../__fixtures__/pdf-text.js";
import { isSourceAnchored } from "./source-anchor.js";

// Define the describe block for the source anchor test suite
describe("isSourceAnchored", () => {
  // Define the test for when the source is anchored
  test("accepts a long verbatim span copied from the PDF", () => {
    expect(
      isSourceAnchored(
        "Chlorophyll in chloroplasts absorbs sunlight and drives the synthesis of glucose",
        FIXTURE_PDF_TEXT,
      ),
    ).toBe(true);
  });

  // Define the test for when the source is anchored
  test("tolerates a single altered word at the edge of a long quote", () => {
    expect(
      isSourceAnchored(
        "Chlorophyll in chloroplasts absorbs sunlight and drives the synthesis of sugar",
        FIXTURE_PDF_TEXT,
      ),
    ).toBe(true);
  });

  // Define the test for when the source is anchored
  test("tolerates an extra trailing word appended by the model", () => {
    expect(
      isSourceAnchored(
        "Cellular respiration occurs in mitochondria and releases energy stored in glucose approximately",
        FIXTURE_PDF_TEXT,
      ),
    ).toBe(true);
  });

  // Define the test for when the source is anchored
  test("rejects a paraphrase that shares no long verbatim run", () => {
    expect(
      isSourceAnchored(
        "Plants use a green pigment to capture light and produce sugar",
        FIXTURE_PDF_TEXT,
      ),
    ).toBe(false);
  });

  // Define the test for when the source is anchored
  test("rejects content not in the PDF at all", () => {
    expect(
      isSourceAnchored("Quantum entanglement in black holes", FIXTURE_PDF_TEXT),
    ).toBe(false);
  });

  // Define the test for when the source is anchored
  test("accepts a short verbatim phrase below the shingle window", () => {
    expect(
      isSourceAnchored("control center of the cell", FIXTURE_PDF_TEXT),
    ).toBe(true);
  });

  // Define the test for when the source is anchored
  test("rejects a short phrase whose words are not contiguous in the PDF", () => {
    expect(
      isSourceAnchored("control nucleus genetic membrane", FIXTURE_PDF_TEXT),
    ).toBe(false);
  });

  // Define the test for when the source is anchored
  test("rejects an empty quote", () => {
    expect(isSourceAnchored("", FIXTURE_PDF_TEXT)).toBe(false);
  });
});