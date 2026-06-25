export type Difficulty = "easy" | "medium" | "hard";

export type Phase =
  | "planning"
  | "awaiting_approval"
  | "quizzing"
  | "awaiting_input"
  | "complete";

export interface PdfMeta {
  filename: string;
  pageCount: number;
  charCount: number;
}

export interface Objective {
  objectiveId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
}

export interface LessonPlan {
  objectives: Objective[];
}

export interface MCQ {
  questionId: string;
  objectiveId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  sourceQuote: string;
}

export type FeedbackDetailKind = "hint" | "explanation";

export interface FeedbackState {
  verdict: "correct" | "incorrect";
  highlightIndex: number;
  detailKind: FeedbackDetailKind;
  detail: string;
  canRetry: boolean;
  canAdvance: boolean;
  isExhausted: boolean;
}

export interface ObjectiveResult {
  objectiveId: string;
  questionId: string;
  correct: boolean;
  attempts: number;
  firstTryCorrect: boolean;
}

export interface SummaryObjective {
  objectiveId: string;
  title: string;
  correct: number;
  total: number;
  firstTryRate: number;
}

export interface Summary {
  perObjective: SummaryObjective[];
  overall: {
    correct: number;
    total: number;
    firstTryRate: number;
  };
  studyTips: string[];
}
