import { Command } from "@langchain/langgraph";

import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";
import { createEdPathGraph } from "../agent/graph.js";
import { seedGraphState } from "../agent/state/graph-update.js";
import type { GraphState } from "../agent/state/annotation.js";
import type { MCQ } from "@repo/types";

import type {
  ApprovalScript,
  AssistTurnRecord,
  EvalCase,
  EvalScriptStep,
  ScenarioRunResult,
  ScenarioSnapshot,
} from "./types.js";

function snapshotState(state: GraphState): ScenarioSnapshot {
  return {
    phase: state.phase,
    currentObjectiveIndex: state.currentObjectiveIndex,
    currentQuestionIndex: state.currentQuestionIndex,
    attempts: state.attempts,
    resultsLength: state.results.length,
    helpTurnsUsed: state.helpTurnsUsed,
  };
}

function resolveWrongIndex(mcq: MCQ): number {
  for (let i = 0; i < mcq.options.length; i++) {
    if (i !== mcq.correctIndex) {
      return i;
    }
  }
  return 0;
}

function resolveAnswerIndex(
  step: Extract<EvalScriptStep, { kind: "answer" }>,
  mcq: MCQ,
): number {
  if (step.selectedIndex === "correct") {
    return mcq.correctIndex;
  }
  if (step.selectedIndex === "wrong") {
    return resolveWrongIndex(mcq);
  }
  return step.selectedIndex;
}

function toApprovalResume(approve: ApprovalScript): Record<string, unknown> {
  if (approve.decision === "changes") {
    return { decision: "changes", note: approve.note };
  }
  return { decision: "approve" };
}

function collectMcqs(
  collected: MCQ[],
  questions: MCQ[],
): MCQ[] {
  const seen = new Set(collected.map((q) => q.questionId));
  const merged = [...collected];
  for (const mcq of questions) {
    if (!seen.has(mcq.questionId)) {
      seen.add(mcq.questionId);
      merged.push(mcq);
    }
  }
  return merged;
}

async function getCurrentMcq(
  graph: ReturnType<typeof createEdPathGraph>,
  config: { configurable: { thread_id: string } },
): Promise<MCQ | null> {
  const state = await graph.getState(config);
  const idx = state.values.currentQuestionIndex;
  return state.values.questions[idx] ?? null;
}

/**
 * Mirrors the UI's "Next question" button: when feedback is resolved
 * (correct/exhausted, i.e. not retryable), send the explicit advance signal so
 * the lesson moves on. After an incorrect (retryable) answer it is a no-op — the
 * next scripted answer retries the same question.
 */
async function advanceIfResolved(
  graph: ReturnType<typeof createEdPathGraph>,
  config: { configurable: { thread_id: string } },
): Promise<void> {
  const state = await graph.getState(config);
  const feedback = state.values.feedback;
  if (feedback && feedback.canRetry === false) {
    await graph.invoke(
      new Command({ resume: { kind: "advance" } }),
      config,
    );
  }
}

async function runCompleteAllCorrect(
  graph: ReturnType<typeof createEdPathGraph>,
  config: { configurable: { thread_id: string } },
  onQuestions?: (questions: MCQ[]) => void,
): Promise<void> {
  const initialState = await graph.getState(config);
  const plan = initialState.values.plan;
  const objectiveCount = plan?.objectives.length ?? 0;
  const totalQuestions = objectiveCount * 3;
  let answered = 0;
  let safety = 0;

  while (answered < totalQuestions && safety < totalQuestions + 10) {
    safety += 1;
    const state = await graph.getState(config);
    if (state.values.phase === "complete") {
      break;
    }

    const mcq = state.values.questions[state.values.currentQuestionIndex];
    if (!mcq) {
      break;
    }

    onQuestions?.(state.values.questions);

    await graph.invoke(
      new Command({
        resume: { kind: "answer", selectedIndex: mcq.correctIndex },
      }),
      config,
    );
    await advanceIfResolved(graph, config);
    answered += 1;
  }
}

async function processStep(
  graph: ReturnType<typeof createEdPathGraph>,
  config: { configurable: { thread_id: string } },
  step: EvalScriptStep,
  context: {
    snapshots: ScenarioSnapshot[];
    helpTranscripts: GraphState["helpThread"][];
    assistTurns: AssistTurnRecord[];
    checkpointState: GraphState | null;
  },
): Promise<GraphState | null> {
  if (step.kind === "checkpoint") {
    if (step.action === "save") {
      const current = await graph.getState(config);
      return { ...current.values };
    }
    return context.checkpointState;
  }

  if (step.kind === "approve") {
    const resume =
      step.decision === "changes"
        ? { decision: "changes", note: step.note ?? "" }
        : { decision: "approve" };
    await graph.invoke(new Command({ resume }), config);
    const state = await graph.getState(config);
    context.snapshots.push(snapshotState(state.values));
    return null;
  }

  if (step.kind === "help") {
    const beforeHelp = await graph.getState(config);
    const mcq =
      beforeHelp.values.questions[beforeHelp.values.currentQuestionIndex];
    context.helpTranscripts.push([...beforeHelp.values.helpThread]);

    await graph.invoke(
      new Command({ resume: { kind: "help", text: step.text } }),
      config,
    );

    const afterHelp = await graph.getState(config);
    context.helpTranscripts.push([...afterHelp.values.helpThread]);
    context.snapshots.push(snapshotState(afterHelp.values));

    const assistantMessage = afterHelp.values.helpThread
      .filter((m: { role: string; content: string }) => m.role === "assistant")
      .at(-1)?.content;
    if (mcq && assistantMessage) {
      context.assistTurns.push({
        questionId: mcq.questionId,
        userMessage: step.text,
        assistantMessage,
        mcq,
      });
    }
    return null;
  }

  const mcq = await getCurrentMcq(graph, config);
  if (!mcq) {
    return null;
  }

  const selectedIndex = resolveAnswerIndex(step, mcq);
  await graph.invoke(
    new Command({ resume: { kind: "answer", selectedIndex } }),
    config,
  );

  // Capture the feedback resting state before advancing (evaluators inspect it).
  const state = await graph.getState(config);
  context.snapshots.push(snapshotState(state.values));

  // Resolved answer → emulate the user's "Next question" click to move on.
  await advanceIfResolved(graph, config);
  return null;
}

export async function runScenario(
  evalCase: EvalCase,
  threadIdPrefix = "eval",
): Promise<ScenarioRunResult> {
  const graph = createEdPathGraph();
  const threadId = `${threadIdPrefix}-${evalCase.id}-${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  const snapshots: ScenarioSnapshot[] = [];
  const helpTranscripts: GraphState["helpThread"][] = [];
  const assistTurns: AssistTurnRecord[] = [];
  let checkpointState: GraphState | null = null;
  let allGeneratedMcqs: MCQ[] = [];

  await graph.invoke(
    seedGraphState(
      buildInitialEdPathState({
        pdfText: evalCase.pdf.text,
        pdfMeta: evalCase.pdf.meta,
      }),
    ),
    config,
  );

  let state = await graph.getState(config);
  allGeneratedMcqs = collectMcqs(allGeneratedMcqs, state.values.questions);
  snapshots.push(snapshotState(state.values));

  const steps = [...evalCase.script.steps];
  let approveHandled = false;

  if (steps[0]?.kind === "checkpoint" && steps[0].action === "save") {
    checkpointState = { ...state.values };
    steps.shift();
  }

  const inlineApproveIndex = steps.findIndex((s) => s.kind === "approve");
  if (inlineApproveIndex >= 0) {
    const approveStep = steps.splice(inlineApproveIndex, 1)[0];
    if (approveStep?.kind === "approve") {
      const resume =
        approveStep.decision === "changes"
          ? { decision: "changes", note: approveStep.note ?? "" }
          : { decision: "approve" };
      await graph.invoke(new Command({ resume }), config);
      approveHandled = true;
      state = await graph.getState(config);
      allGeneratedMcqs = collectMcqs(allGeneratedMcqs, state.values.questions);
      snapshots.push(snapshotState(state.values));
    }
  }

  if (!approveHandled && evalCase.script.approve) {
    await graph.invoke(
      new Command({ resume: toApprovalResume(evalCase.script.approve) }),
      config,
    );
    state = await graph.getState(config);
    allGeneratedMcqs = collectMcqs(allGeneratedMcqs, state.values.questions);
    snapshots.push(snapshotState(state.values));
  }

  for (const step of steps) {
    const saved = await processStep(graph, config, step, {
      snapshots,
      helpTranscripts,
      assistTurns,
      checkpointState,
    });
    if (saved) {
      checkpointState = saved;
    }
    const mid = await graph.getState(config);
    allGeneratedMcqs = collectMcqs(allGeneratedMcqs, mid.values.questions);
  }

  if (evalCase.script.completeAllCorrect) {
    await runCompleteAllCorrect(graph, config, (questions) => {
      allGeneratedMcqs = collectMcqs(allGeneratedMcqs, questions);
    });
  }

  const finalState = (await graph.getState(config)).values;
  allGeneratedMcqs = collectMcqs(allGeneratedMcqs, finalState.questions);

  return {
    caseId: evalCase.id,
    threadId,
    finalState,
    allGeneratedMcqs,
    helpTranscripts,
    assistTurns,
    snapshots,
    checkpointState,
    tokensUsed: finalState.tokensUsed,
  };
}
