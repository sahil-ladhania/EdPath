import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const WEB_URL = process.env.SMOKE_WEB_URL ?? "http://localhost:3000";
const FIXTURE_DIR = join(process.cwd(), "tmp", "upload-smoke");

const VALID_TEXT_PDF = `%PDF-1.4
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
%%EOF`;

mkdirSync(FIXTURE_DIR, { recursive: true });
writeFileSync(join(FIXTURE_DIR, "valid-text.pdf"), VALID_TEXT_PDF);
writeFileSync(join(FIXTURE_DIR, "fake.pdf"), "plain text file content");
writeFileSync(
  join(FIXTURE_DIR, "oversized.pdf"),
  Buffer.concat([Buffer.from(VALID_TEXT_PDF), Buffer.alloc(16 * 1024 * 1024)]),
);
writeFileSync(
  join(FIXTURE_DIR, "scanned.pdf"),
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
);
writeFileSync(
  join(FIXTURE_DIR, "near-empty.pdf"),
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
);

async function waitForUploadOutcome(page) {
  await page.waitForFunction(() => {
    const loading = Array.from(document.querySelectorAll("p")).some((node) =>
      node.textContent?.includes("Checking your PDF"),
    );
    if (loading) {
      return false;
    }

    const messages = Array.from(document.querySelectorAll("p"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean);

    return messages.some(
      (message) =>
        message.includes("PDF ready") ||
        message.includes("Upload a single PDF") ||
        message.includes("too large") ||
        message.includes("scanned or image-only") ||
        message.includes("no usable text") ||
        message.includes("Couldn't reach the server") ||
        message.includes("Something went wrong uploading") ||
        message.includes("unexpected response"),
    );
  }, { timeout: 120_000 });
}

async function readOutcome(page) {
  const bannerParagraphs = page.locator("div.rounded-lg.border p");
  const count = await bannerParagraphs.count();

  for (let index = 0; index < count; index += 1) {
    const text = (await bannerParagraphs.nth(index).textContent())?.trim();
    if (
      text &&
      !text.includes("Drag a PDF here") &&
      !text.includes("PDF only ·") &&
      !text.includes("Your file is used")
    ) {
      return text;
    }
  }

  return "(outcome banner not found)";
}

async function readFileCard(page) {
  const card = page.locator("div.rounded-lg.border.border-border.bg-paper.px-4.py-4");
  if ((await card.count()) === 0) {
    return null;
  }

  return (await card.first().innerText()).replace(/\s+/g, " ").trim();
}

async function uploadFixture(page, filename) {
  await page.goto(WEB_URL, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').setInputFiles(join(FIXTURE_DIR, filename));
  await waitForUploadOutcome(page);
  await page.waitForTimeout(500);
}

async function runCases1Through5(page, consoleErrors) {
  const results = [];

  await uploadFixture(page, "valid-text.pdf");
  const case1Banner = await readOutcome(page);
  const case1Card = await readFileCard(page);
  await page.getByRole("button", { name: "Start lesson" }).click();
  await page.waitForURL(/\/lesson\/[0-9a-f-]{36}$/i, { timeout: 20_000 });
  results.push({
    case: 1,
    banner: case1Banner,
    fileCard: case1Card,
    navigatedTo: page.url(),
    pass:
      case1Banner.includes("PDF ready") &&
      case1Card?.includes("1 pages") === true &&
      case1Card?.includes("414") === true &&
      /\/lesson\/[0-9a-f-]{36}$/i.test(page.url()),
  });

  for (const [caseNumber, filename] of [
    [2, "fake.pdf"],
    [3, "oversized.pdf"],
    [4, "scanned.pdf"],
    [5, "near-empty.pdf"],
  ]) {
    await uploadFixture(page, filename);
    const banner = await readOutcome(page);
    const fileCard = await readFileCard(page);
    results.push({
      case: caseNumber,
      banner,
      fileCard,
      pass: fileCard === null && banner.length > 0,
    });
  }

  return { results, consoleErrors };
}

async function runCase6(page, consoleErrors) {
  await uploadFixture(page, "valid-text.pdf");
  const banner = await readOutcome(page);
  const fileCard = await readFileCard(page);

  return {
    case: 6,
    banner,
    fileCard,
    consoleErrors,
    pass:
      banner.includes("Couldn't reach the server") &&
      fileCard === null,
  };
}

async function main() {
  const mode = process.argv[2] ?? "with-backend";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    if (mode === "with-backend") {
      const output = await runCases1Through5(page, consoleErrors);
      console.log(JSON.stringify(output, null, 2));
    } else {
      const output = await runCase6(page, consoleErrors);
      console.log(JSON.stringify(output, null, 2));
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
