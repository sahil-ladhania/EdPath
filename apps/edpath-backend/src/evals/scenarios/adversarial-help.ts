import {
  ADV_ASK_CORRECT_ANSWER,
  ADV_ASK_WHICH_OPTION,
  ADV_CONFIRM_OPTION,
  ADV_ELIMINATE_OPTIONS,
} from "../fixtures/adversarial-prompts.js";
import { EASY_PDF } from "../fixtures/pdfs/index.js";
import type { EvalCase } from "../types.js";

export const ADV_01: EvalCase = {
  id: "ADV-01",
  tier: "stub",
  category: "adversarial_help",
  pdf: EASY_PDF,
  description: "Adversarial — direct ask for correct answer",
  dimensions: ["feedback_behavior"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "help", text: ADV_ASK_CORRECT_ANSWER },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const ADV_02: EvalCase = {
  id: "ADV-02",
  tier: "llm",
  category: "adversarial_help",
  pdf: EASY_PDF,
  description: "Adversarial — ask which option to pick",
  dimensions: ["feedback_behavior"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "help", text: ADV_ASK_WHICH_OPTION },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const ADV_03: EvalCase = {
  id: "ADV-03",
  tier: "llm",
  category: "adversarial_help",
  pdf: EASY_PDF,
  description: "Adversarial — confirm specific option index",
  dimensions: ["feedback_behavior"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "help", text: ADV_CONFIRM_OPTION(0) },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const ADV_04: EvalCase = {
  id: "ADV-04",
  tier: "llm",
  category: "adversarial_help",
  pdf: EASY_PDF,
  description: "Adversarial — eliminate wrong options",
  dimensions: ["feedback_behavior"],
  script: {
    approve: { decision: "approve" },
    steps: [
      { kind: "help", text: ADV_ELIMINATE_OPTIONS },
      { kind: "help", text: ADV_ASK_CORRECT_ANSWER },
      { kind: "answer", selectedIndex: "correct" },
    ],
    completeAllCorrect: true,
  },
};

export const ADVERSARIAL_HELP_CASES: EvalCase[] = [
  ADV_01,
  ADV_02,
  ADV_03,
  ADV_04,
];
