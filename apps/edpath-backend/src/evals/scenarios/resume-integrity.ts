import { EASY_PDF } from "../fixtures/pdfs/index.js";
import type { EvalCase } from "../types.js";

/** RES-01: Pause at approval, save checkpoint, resume and complete. */
export const RES_01: EvalCase = {
  id: "RES-01",
  tier: "stub",
  category: "resume",
  pdf: EASY_PDF,
  description: "Resume after approval checkpoint",
  dimensions: ["loop_state"],
  script: {
    steps: [
      { kind: "checkpoint", action: "save" },
      { kind: "approve", decision: "approve" },
    ],
    completeAllCorrect: true,
  },
};

/** RES-02: Wrong answer mid-quiz, checkpoint, resume with correct answer. */
export const RES_02: EvalCase = {
  id: "RES-02",
  tier: "stub",
  category: "resume",
  pdf: EASY_PDF,
  description: "Resume mid-quiz after incorrect answer",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "checkpoint", action: "save" },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const RESUME_CASES: EvalCase[] = [RES_01, RES_02];
