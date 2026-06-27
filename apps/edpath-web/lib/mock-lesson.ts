import type {
  CoAgentState,
  LessonPlan,
  ObjectiveResult,
  PdfMeta,
  PublicMCQ,
  Summary,
} from "@repo/types";

export const MAX_ATTEMPTS = 3;
export const MAX_HELP = 3;

const mockPdfMeta: PdfMeta = {
  filename: "cell-biology-foundations.pdf",
  pageCount: 18,
  charCount: 84250,
};

const mockPlan: LessonPlan = {
  objectives: [
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
      title: "Understand how cells divide and why safeguards matter",
      description:
        "Describe the purpose of mitosis and explain why safeguards keep damaged cells from dividing.",
      difficulty: "hard",
    },
  ],
};

const questions: PublicMCQ[] = [
  {
    questionId: "q-1",
    objectiveId: "obj-1",
    question:
      "Which structure acts as the cell's control center because it contains the genetic material?",
    options: ["Cell membrane", "Nucleus", "Ribosome", "Cytoplasm"],
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
  },
  {
    questionId: "q-3",
    objectiveId: "obj-1",
    question:
      "Which part of the cell is best described as the gel-like region where organelles are suspended?",
    options: ["Cell wall", "Nucleus", "Cytoplasm", "Golgi apparatus"],
  },
  {
    questionId: "q-4",
    objectiveId: "obj-2",
    question: "Why is the cell membrane described as selectively permeable?",
    options: [
      "It lets every substance pass freely",
      "It only allows water to enter",
      "It controls which substances enter or leave",
      "It stores nutrients for later use",
    ],
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
  },
  {
    questionId: "q-6",
    objectiveId: "obj-2",
    question:
      "Osmosis is specifically the movement of which substance across a selectively permeable membrane?",
    options: ["Oxygen", "Glucose", "Water", "Proteins"],
  },
  {
    questionId: "q-7",
    objectiveId: "obj-3",
    question:
      "Which organelle is primarily responsible for releasing usable energy from food in most eukaryotic cells?",
    options: ["Mitochondrion", "Chloroplast", "Nucleus", "Vacuole"],
  },
  {
    questionId: "q-8",
    objectiveId: "obj-3",
    question: "What is the main role of chloroplasts in plant cells?",
    options: [
      "Direct cell division",
      "Carry out photosynthesis",
      "Digest worn-out parts",
      "Package proteins",
    ],
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
  },
  {
    questionId: "q-10",
    objectiveId: "obj-4",
    question: "What is the main purpose of mitosis in multicellular organisms?",
    options: [
      "To produce genetically identical cells for growth and repair",
      "To mix genes for reproduction",
      "To create ATP inside the nucleus",
      "To transport water through the membrane",
    ],
  },
  {
    questionId: "q-11",
    objectiveId: "obj-4",
    question: "Why are safeguards important during the cell cycle?",
    options: [
      "They speed up every stage of division",
      "They prevent damaged or incomplete cells from continuing to divide",
      "They help chloroplasts absorb more light",
      "They replace the need for DNA replication",
    ],
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
  },
];

const emptySummary: Summary = {
  perObjective: [],
  overall: {
    correct: 0,
    total: 0,
    firstTryRate: 0,
  },
  studyTips: [],
};

export function getMockCoAgentState(): CoAgentState {
  return {
    pdfMeta: structuredClone(mockPdfMeta),
    plan: structuredClone(mockPlan),
    approval: null,
    currentObjectiveIndex: 0,
    questions: structuredClone(questions),
    currentQuestionIndex: 0,
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    helpThread: [],
    feedback: null,
    results: [],
    score: {
      correct: 0,
      total: 0,
      firstTry: 0,
    },
    summary: structuredClone(emptySummary),
    phase: "awaiting_approval",
    lastError: null,
  };
}

export function getQuestionsForObjective(
  state: CoAgentState,
  objectiveId: string,
): PublicMCQ[] {
  return state.questions.filter((question) => question.objectiveId === objectiveId);
}

export function buildSummary(
  plan: LessonPlan,
  results: ObjectiveResult[],
): Summary {
  const perObjective = plan.objectives.map((objective) => {
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
      firstTryRate: total === 0 ? 0 : firstTryCorrect / total,
    };
  });

  const totalQuestions = results.length;
  const overallCorrect = results.filter((result) => result.correct).length;
  const firstTryCorrect = results.filter((result) => result.firstTryCorrect).length;

  const weakObjectives = perObjective
    .filter((objective) => objective.firstTryRate < 1)
    .sort((left, right) => left.firstTryRate - right.firstTryRate);

  return {
    perObjective,
    overall: {
      correct: overallCorrect,
      total: totalQuestions,
      firstTryRate: totalQuestions === 0 ? 0 : firstTryCorrect / totalQuestions,
    },
    studyTips:
      weakObjectives.length > 0
        ? weakObjectives.slice(0, 3).map((objective) => {
            return `Revisit "${objective.title}" and turn the source explanation into a 3-bullet note before your next quiz run.`;
          })
        : [
            "You were strong across every objective. Keep the momentum by summarizing the chapter in your own words once more tomorrow.",
          ],
  };
}
