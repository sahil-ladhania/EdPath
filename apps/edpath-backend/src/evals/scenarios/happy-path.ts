/** Happy-path eval scenarios — full lesson flow with correct and wrong answers. */
import type { EvalCase } from "../types.js";
import { EASY_PDF, DENSE_PDF } from "../fixtures/pdfs/index.js";

const ALL_DIMENSIONS: EvalCase["dimensions"] = [
  "plan_grounded",
  "mcqs_grounded",
  "feedback_behavior",
  "loop_state",
];

function allCorrectSteps(count: number): EvalCase["script"]["steps"] {
  return Array.from({ length: count }, () => ({
    kind: "answer" as const,
    selectedIndex: "correct" as const,
  }));
}

/** HP-01: Easy PDF, approve, all correct (stub tier). */
export const HP_01: EvalCase = {
  id: "HP-01",
  tier: "stub",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF happy path — all correct answers",
  dimensions: ALL_DIMENSIONS,
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_02: EvalCase = {
  id: "HP-02",
  tier: "llm",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — explicit step-by-step correct answers",
  dimensions: ALL_DIMENSIONS,
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_03: EvalCase = {
  id: "HP-03",
  tier: "stub",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — wrong then correct retry",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const HP_04: EvalCase = {
  id: "HP-04",
  tier: "llm",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — all correct after approve",
  dimensions: ALL_DIMENSIONS,
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_05: EvalCase = {
  id: "HP-05",
  tier: "llm",
  category: "happy",
  pdf: DENSE_PDF,
  description: "Dense PDF — mixed wrong then correct",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_06: EvalCase = {
  id: "HP-06",
  tier: "llm",
  category: "happy",
  pdf: DENSE_PDF,
  description: "Dense PDF — first question wrong then correct",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "correct" },
      ...allCorrectSteps(5).slice(1),
    ],
  },
};

export const HP_07: EvalCase = {
  id: "HP-07",
  tier: "llm",
  category: "happy",
  pdf: DENSE_PDF,
  description: "Dense PDF — complete all correct",
  dimensions: ALL_DIMENSIONS,
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_08: EvalCase = {
  id: "HP-08",
  tier: "llm",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — help then answer",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "help", text: "Can you give me a conceptual hint?" },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const HP_09: EvalCase = {
  id: "HP-09",
  tier: "llm",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — exhaust MAX_ATTEMPTS on first question",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "wrong" },
    ],
    completeAllCorrect: true,
  },
};

export const HP_10: EvalCase = {
  id: "HP-10",
  tier: "llm",
  category: "happy",
  pdf: EASY_PDF,
  description: "Easy PDF — complete after attempt exhaustion",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "wrong" },
    ],
    completeAllCorrect: true,
  },
};

export const HP_11: EvalCase = {
  id: "HP-11",
  tier: "llm",
  category: "happy",
  pdf: DENSE_PDF,
  description: "Dense PDF — all correct",
  dimensions: ALL_DIMENSIONS,
  script: {
    approve: { decision: "approve" },
    completeAllCorrect: true,
    steps: [],
  },
};

export const HP_12: EvalCase = {
  id: "HP-12",
  tier: "llm",
  category: "happy",
  pdf: DENSE_PDF,
  description: "Dense PDF — retry on first two questions",
  dimensions: ["feedback_behavior", "loop_state"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "correct" },
      { kind: "answer", selectedIndex: "wrong" },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const HAPPY_PATH_CASES: EvalCase[] = [
  HP_01,
  HP_02,
  HP_03,
  HP_04,
  HP_05,
  HP_06,
  HP_07,
  HP_08,
  HP_09,
  HP_10,
  HP_11,
  HP_12,
];
