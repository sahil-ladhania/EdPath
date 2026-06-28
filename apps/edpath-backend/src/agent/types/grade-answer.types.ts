/** Agent-local deterministic grader input/output contracts (N6). */
import type { MCQ } from "@repo/types";

/** Input to the deterministic grader (N6) — agent-local contract. */
export interface GradeAnswerInput {
  selectedIndex: number;
  mcq: MCQ;
  priorAttempts: number;
}

/** Output from gradeAnswer — agent-local contract. */
export interface GradeAnswerOutput {
  verdict: "correct" | "incorrect";
  firstTryCorrect: boolean;
  attempts: number;
}
