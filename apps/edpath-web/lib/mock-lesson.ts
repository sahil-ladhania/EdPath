import type {
  LessonPlan,
  MCQ,
  Objective,
  ObjectiveResult,
  PdfMeta,
  Summary,
  SummaryObjective,
} from "@/types/lesson.types";

export const MAX_ATTEMPTS = 3;
export const MAX_HELP = 3;

export const mockPdfMeta: PdfMeta = {
  filename: "cell-biology-foundations.pdf",
  pageCount: 18,
  charCount: 84250,
};

const objectives: Objective[] = [
  {
    objectiveId: "obj-1",
    title: "Identify the basic parts of a cell",
    description:
      "Recognize the membrane, nucleus, cytoplasm, and ribosomes and describe their role in a living cell.",
    difficulty: "easy",
  },
  {
    objectiveId: "obj-2",
    title: "Explain how the cell membrane regulates transport",
    description:
      "Connect selective permeability, diffusion, and osmosis to how materials move in and out of the cell.",
    difficulty: "medium",
  },
  {
    objectiveId: "obj-3",
    title: "Compare how mitochondria and chloroplasts convert energy",
    description:
      "Differentiate cellular respiration from photosynthesis and identify where each process happens.",
    difficulty: "medium",
  },
  {
    objectiveId: "obj-4",
    title: "Understand how cells divide and why checkpoints matter",
    description:
      "Describe the purpose of mitosis and explain why checkpoints keep damaged cells from dividing.",
    difficulty: "hard",
  },
];

export const mockPlan: LessonPlan = {
  objectives,
};

export const objectiveQuestionMap: Record<string, MCQ[]> = {
  "obj-1": [
    {
      questionId: "q-1",
      objectiveId: "obj-1",
      question:
        "Which structure acts as the cell's control center because it contains the genetic material?",
      options: ["Cell membrane", "Nucleus", "Ribosome", "Cytoplasm"],
      correctIndex: 1,
      explanation:
        "The nucleus stores DNA and coordinates many of the cell's activities, so it functions as the control center.",
      hint:
        "Focus on the structure that protects and organizes the DNA rather than the one that makes proteins.",
      sourceQuote:
        "The nucleus contains the cell's genetic material and directs cellular activities.",
    },
    {
      questionId: "q-2",
      objectiveId: "obj-1",
      question: "What is the main job of ribosomes in a cell?",
      options: [
        "Breaking down waste",
        "Producing ATP",
        "Building proteins",
        "Storing water",
      ],
      correctIndex: 2,
      explanation:
        "Ribosomes assemble amino acids into proteins, which the cell needs for structure and function.",
      hint:
        "Look for the organelle tied to protein synthesis, not long-term storage or energy release.",
      sourceQuote:
        "Ribosomes are the sites of protein synthesis in both simple and complex cells.",
    },
    {
      questionId: "q-3",
      objectiveId: "obj-1",
      question:
        "Which part of the cell is best described as the gel-like region where organelles are suspended?",
      options: ["Cell wall", "Nucleus", "Cytoplasm", "Golgi apparatus"],
      correctIndex: 2,
      explanation:
        "The cytoplasm fills the cell and holds organelles in place while allowing materials to move within the cell.",
      hint:
        "Choose the broad internal region, not a single organelle or the outer boundary.",
      sourceQuote:
        "Cytoplasm is the gel-like material inside the membrane where organelles are suspended.",
    },
  ],
  "obj-2": [
    {
      questionId: "q-4",
      objectiveId: "obj-2",
      question:
        "Why is the cell membrane described as selectively permeable?",
      options: [
        "It lets every substance pass freely",
        "It only allows water to enter",
        "It controls which substances enter or leave",
        "It stores nutrients for later use",
      ],
      correctIndex: 2,
      explanation:
        "Selective permeability means the membrane regulates what crosses it, helping the cell maintain internal balance.",
      hint:
        "Think about regulation and control, not complete openness or permanent storage.",
      sourceQuote:
        "The cell membrane is selectively permeable, allowing some materials to cross while blocking others.",
    },
    {
      questionId: "q-5",
      objectiveId: "obj-2",
      question:
        "Diffusion moves particles across a membrane from an area of higher concentration to an area of what?",
      options: [
        "Lower concentration",
        "Higher pressure only",
        "Higher concentration",
        "Equal temperature",
      ],
      correctIndex: 0,
      explanation:
        "Diffusion moves particles down their concentration gradient, from higher concentration to lower concentration.",
      hint:
        "The key phrase is 'down the gradient,' which means moving toward less crowding.",
      sourceQuote:
        "During diffusion, particles move from regions of high concentration to regions of low concentration.",
    },
    {
      questionId: "q-6",
      objectiveId: "obj-2",
      question:
        "Osmosis is specifically the movement of which substance across a selectively permeable membrane?",
      options: ["Oxygen", "Glucose", "Water", "Proteins"],
      correctIndex: 2,
      explanation:
        "Osmosis refers only to the movement of water across a selectively permeable membrane.",
      hint:
        "This transport term is narrower than diffusion because it applies to just one molecule.",
      sourceQuote:
        "Osmosis is the diffusion of water through a selectively permeable membrane.",
    },
  ],
  "obj-3": [
    {
      questionId: "q-7",
      objectiveId: "obj-3",
      question:
        "Which organelle is primarily responsible for releasing usable energy from food in most eukaryotic cells?",
      options: ["Mitochondrion", "Chloroplast", "Nucleus", "Vacuole"],
      correctIndex: 0,
      explanation:
        "Mitochondria perform cellular respiration, converting energy stored in food into ATP.",
      hint:
        "Choose the organelle associated with respiration and ATP, not the one tied to light capture.",
      sourceQuote:
        "Mitochondria carry out cellular respiration to release usable energy from food.",
    },
    {
      questionId: "q-8",
      objectiveId: "obj-3",
      question:
        "What is the main role of chloroplasts in plant cells?",
      options: [
        "Direct cell division",
        "Carry out photosynthesis",
        "Digest worn-out parts",
        "Package proteins",
      ],
      correctIndex: 1,
      explanation:
        "Chloroplasts capture light energy and use it to build sugars during photosynthesis.",
      hint:
        "Look for the organelle linked to light energy and sugar production.",
      sourceQuote:
        "Chloroplasts contain chlorophyll and are the site of photosynthesis in plant cells.",
    },
    {
      questionId: "q-9",
      objectiveId: "obj-3",
      question:
        "Which statement best contrasts photosynthesis and cellular respiration?",
      options: [
        "Both happen only in animal cells",
        "Photosynthesis releases energy from sugar, while respiration stores it",
        "Photosynthesis captures energy to build sugar, while respiration breaks sugar down to release energy",
        "They are identical processes with different names",
      ],
      correctIndex: 2,
      explanation:
        "Photosynthesis stores energy in sugars, while cellular respiration breaks those sugars down to release usable energy.",
      hint:
        "One process builds energy-rich molecules; the other pulls usable energy back out of them.",
      sourceQuote:
        "Photosynthesis captures light energy to make sugars, whereas cellular respiration breaks sugars down to release energy.",
    },
  ],
  "obj-4": [
    {
      questionId: "q-10",
      objectiveId: "obj-4",
      question:
        "What is the main purpose of mitosis in multicellular organisms?",
      options: [
        "To produce genetically identical cells for growth and repair",
        "To mix genes for reproduction",
        "To create ATP inside the nucleus",
        "To transport water through the membrane",
      ],
      correctIndex: 0,
      explanation:
        "Mitosis produces genetically similar daughter cells, which organisms use for growth, repair, and replacement.",
      hint:
        "Focus on growth and tissue maintenance rather than sexual reproduction.",
      sourceQuote:
        "Mitosis produces two genetically similar daughter cells used for growth and tissue repair.",
    },
    {
      questionId: "q-11",
      objectiveId: "obj-4",
      question:
        "Why are checkpoints important during the cell cycle?",
      options: [
        "They speed up every stage of division",
        "They prevent damaged or incomplete cells from continuing to divide",
        "They help chloroplasts absorb more light",
        "They replace the need for DNA replication",
      ],
      correctIndex: 1,
      explanation:
        "Checkpoints verify that critical steps are complete and can stop damaged cells from dividing.",
      hint:
        "Think of checkpoints as quality-control pauses, not accelerators.",
      sourceQuote:
        "Cell-cycle checkpoints help ensure that damaged DNA is not passed to new cells.",
    },
    {
      questionId: "q-12",
      objectiveId: "obj-4",
      question:
        "If DNA damage is detected before division, what is the safest biological outcome?",
      options: [
        "Proceed through mitosis immediately",
        "Skip replication and continue anyway",
        "Pause the cycle for repair or stop division",
        "Convert the cell membrane into a cell wall",
      ],
      correctIndex: 2,
      explanation:
        "A healthy checkpoint response pauses the cycle for repair or prevents division if the damage cannot be fixed.",
      hint:
        "A safety system should reduce the spread of mistakes, not rush past them.",
      sourceQuote:
        "When damage is detected, checkpoints can pause the cycle for repair or stop division altogether.",
    },
  ],
};

export interface LessonSnapshot {
  plan: LessonPlan;
  pdfMeta: PdfMeta;
  objectiveQuestionMap: Record<string, MCQ[]>;
}

export function getMockLessonSnapshot(): LessonSnapshot {
  return {
    plan: structuredClone(mockPlan),
    pdfMeta: structuredClone(mockPdfMeta),
    objectiveQuestionMap: structuredClone(objectiveQuestionMap),
  };
}

export function buildSummary(
  plan: LessonPlan,
  results: ObjectiveResult[],
): Summary {
  const perObjective: SummaryObjective[] = plan.objectives.map((objective) => {
    const objectiveResults = results.filter(
      (result) => result.objectiveId === objective.objectiveId,
    );
    const correct = objectiveResults.filter((result) => result.correct).length;
    const firstTryCorrect = objectiveResults.filter(
      (result) => result.firstTryCorrect,
    ).length;
    const total = objectiveResults.length;

    return {
      objectiveId: objective.objectiveId,
      title: objective.title,
      correct,
      total,
      firstTryRate: total === 0 ? 0 : Math.round((firstTryCorrect / total) * 100),
    };
  });

  const totalQuestions = results.length;
  const overallCorrect = results.filter((result) => result.correct).length;
  const firstTryCorrect = results.filter((result) => result.firstTryCorrect).length;

  const weakObjectives = perObjective
    .filter((objective) => objective.firstTryRate < 100)
    .sort((left, right) => left.firstTryRate - right.firstTryRate);

  const studyTips =
    weakObjectives.length > 0
      ? weakObjectives.slice(0, 3).map((objective) => {
          return `Revisit "${objective.title}" and turn the source explanation into a 3-bullet note before your next quiz run.`;
        })
      : [
          "You were strong across every objective. Keep the momentum by summarizing the chapter in your own words once more tomorrow.",
        ];

  return {
    perObjective,
    overall: {
      correct: overallCorrect,
      total: totalQuestions,
      firstTryRate:
        totalQuestions === 0
          ? 0
          : Math.round((firstTryCorrect / totalQuestions) * 100),
    },
    studyTips,
  };
}
