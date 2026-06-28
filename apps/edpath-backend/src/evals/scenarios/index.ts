/** Eval case registry — aggregates all scenario suites and filter helpers. */
import { ADVERSARIAL_HELP_CASES } from "./adversarial-help.js";
import { EDGE_PDF_CASES } from "./edge-pdfs.js";
import { HAPPY_PATH_CASES } from "./happy-path.js";
import { RESUME_CASES } from "./resume-integrity.js";
import type { EvalCase, EvalTier } from "../types.js";

export const ALL_EVAL_CASES: EvalCase[] = [
  ...HAPPY_PATH_CASES,
  ...ADVERSARIAL_HELP_CASES,
  ...EDGE_PDF_CASES,
  ...RESUME_CASES,
];

export const STUB_TIER_CASES: EvalCase[] = ALL_EVAL_CASES.filter(
  (c) => c.tier === "stub",
);

export function filterEvalCases(options: {
  tier?: EvalTier;
  filter?: string;
  ids?: string[];
}): EvalCase[] {
  let cases = ALL_EVAL_CASES;

  if (options.tier) {
    cases = cases.filter((c) => c.tier === options.tier);
  }

  if (options.ids && options.ids.length > 0) {
    cases = cases.filter((c) => options.ids!.includes(c.id));
  }

  if (options.filter) {
    const pattern = options.filter.replace(/\*/g, ".*");
    const regex = new RegExp(`^${pattern}$`, "i");
    cases = cases.filter((c) => regex.test(c.id));
  }

  return cases;
}

export function getEvalCaseById(id: string): EvalCase | undefined {
  return ALL_EVAL_CASES.find((c) => c.id === id);
}
