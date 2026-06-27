import {
  Annotation,
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import type { ApprovalDecision, CoAgentState } from "@repo/types";

export const WALKING_SKELETON_THREAD_ID = "walking-skeleton-thread";

const walkingSkeletonPlan: NonNullable<CoAgentState["plan"]> = {
  objectives: [
    {
      objectiveId: "stub-objective-1",
      title: "Approve the stub plan",
      description:
        "A placeholder objective used only to verify CopilotKit state and interrupts.",
      difficulty: "easy",
    },
  ],
};

const walkingSkeletonQuestion: CoAgentState["questions"][number] = {
  questionId: "stub-question-1",
  objectiveId: "stub-objective-1",
  question: "Which placeholder step comes after approving the stub plan?",
  options: [
    "Render the hardcoded quiz placeholder",
    "Parse a real PDF",
    "Generate real MCQs",
    "Grade a submitted answer",
  ],
};

export function createWalkingSkeletonState(): CoAgentState {
  return {
    pdfMeta: {
      filename: "stub.pdf",
      charCount: 0,
      pageCount: 0,
    },
    plan: walkingSkeletonPlan,
    approval: null,
    currentObjectiveIndex: 0,
    questions: [walkingSkeletonQuestion],
    currentQuestionIndex: 0,
    selectedIndex: null,
    attempts: 0,
    helpTurnsUsed: 0,
    helpThread: [],
    feedback: null,
    results: [],
    score: {
      correct: 0,
      total: 1,
      firstTry: 0,
    },
    summary: null,
    phase: "awaiting_approval",
    lastError: null,
  };
}

const CoAgentStateAnnotation = Annotation.Root({
  pdfMeta: Annotation<CoAgentState["pdfMeta"]>(),
  plan: Annotation<CoAgentState["plan"]>(),
  approval: Annotation<CoAgentState["approval"]>(),
  currentObjectiveIndex: Annotation<CoAgentState["currentObjectiveIndex"]>(),
  questions: Annotation<CoAgentState["questions"]>(),
  currentQuestionIndex: Annotation<CoAgentState["currentQuestionIndex"]>(),
  selectedIndex: Annotation<CoAgentState["selectedIndex"]>(),
  attempts: Annotation<CoAgentState["attempts"]>(),
  helpTurnsUsed: Annotation<CoAgentState["helpTurnsUsed"]>(),
  helpThread: Annotation<CoAgentState["helpThread"]>(),
  feedback: Annotation<CoAgentState["feedback"]>(),
  results: Annotation<CoAgentState["results"]>(),
  score: Annotation<CoAgentState["score"]>(),
  summary: Annotation<CoAgentState["summary"]>(),
  phase: Annotation<CoAgentState["phase"]>(),
  lastError: Annotation<CoAgentState["lastError"]>(),
});

type WalkingSkeletonState = typeof CoAgentStateAnnotation.State;

interface ApprovalInterruptPayload {
  type: "approval";
  plan: NonNullable<CoAgentState["plan"]>;
}

function initializeStubStateNode(): CoAgentState {
  return createWalkingSkeletonState();
}

function approvalGateNode(
  state: WalkingSkeletonState,
): Pick<CoAgentState, "approval" | "phase"> {
  const approval = interrupt<ApprovalInterruptPayload, ApprovalDecision>({
    type: "approval",
    plan: state.plan ?? walkingSkeletonPlan,
  });

  return {
    approval,
    phase: approval.decision === "approve" ? "quizzing" : "awaiting_approval",
  };
}

function quizPlaceholderNode(): Pick<CoAgentState, "phase"> {
  return {
    phase: "quizzing",
  };
}

export function createWalkingSkeletonGraph(): ReturnType<
  ReturnType<typeof createWalkingSkeletonWorkflow>["compile"]
> {
  return createWalkingSkeletonWorkflow().compile({
    checkpointer: new MemorySaver(),
  });
}

export const graph = createWalkingSkeletonGraph();

function createWalkingSkeletonWorkflow() {
  return new StateGraph(CoAgentStateAnnotation)
    .addNode("initialize_stub_state", initializeStubStateNode)
    .addNode("approval_gate", approvalGateNode)
    .addNode("quiz_placeholder", quizPlaceholderNode)
    .addEdge(START, "initialize_stub_state")
    .addEdge("initialize_stub_state", "approval_gate")
    .addEdge("approval_gate", "quiz_placeholder")
    .addEdge("quiz_placeholder", END);
}
