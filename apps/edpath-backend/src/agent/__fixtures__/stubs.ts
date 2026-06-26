import { LessonPlanSchema } from "@repo/schemas";
import type { LessonPlan, MCQ } from "@repo/types";

import { FIXTURE_PDF_TEXT, FIXTURE_SOURCE_QUOTE } from "../__fixtures__/pdf-text.js";

/** Valid placeholder plan for stub / test paths. */
export function createStubLessonPlan(): LessonPlan {
  return {
    objectives: [
      {
        objectiveId: "obj-1",
        title: "Understand photosynthesis basics",
        description:
          "Explain how plants convert light energy into chemical energy using chlorophyll.",
        difficulty: "easy",
      },
      {
        objectiveId: "obj-2",
        title: "Compare photosynthesis and respiration",
        description:
          "Differentiate energy capture in chloroplasts from energy release in mitochondria.",
        difficulty: "medium",
      },
    ],
  };
}

/** Validates stub plan against schema. */
export function assertStubLessonPlan(plan: LessonPlan): LessonPlan {
  return LessonPlanSchema.parse(plan);
}

/** Three grounded MCQs for obj-1 (test / stub). */
export function createStubMcqs(objectiveId: string = "obj-1"): MCQ[] {
  const base = {
    objectiveId,
    options: [
      "Chloroplasts",
      "Mitochondria",
      "Nucleus",
      "Cell membrane",
    ] as [string, string, string, string],
    correctIndex: 0,
    explanation: "Chloroplasts contain chlorophyll and drive photosynthesis.",
    hint: "Think about where light energy is captured in plant cells.",
    sourceQuote: FIXTURE_SOURCE_QUOTE,
  };

  return [
    {
      ...base,
      questionId: `${objectiveId}-q1`,
      question: "Where does photosynthesis primarily occur in plant cells?",
    },
    {
      ...base,
      questionId: `${objectiveId}-q2`,
      question: "What pigment absorbs sunlight during photosynthesis?",
      correctIndex: 0,
      options: [
        "Chlorophyll",
        "Hemoglobin",
        "Melanin",
        "Keratin",
      ],
      explanation: "Chlorophyll in chloroplasts absorbs light for photosynthesis.",
      hint: "This green pigment is found in chloroplasts.",
      sourceQuote: FIXTURE_SOURCE_QUOTE,
    },
    {
      ...base,
      questionId: `${objectiveId}-q3`,
      question: "What gas do plants use during photosynthesis alongside water?",
      correctIndex: 0,
      options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
      explanation:
        "Plants use carbon dioxide and water to synthesize glucose during photosynthesis.",
      hint: "Plants take in a common atmospheric gas used to build sugars.",
      sourceQuote:
        "drives the synthesis of glucose from carbon dioxide and water",
    },
  ];
}

export { FIXTURE_PDF_TEXT };
