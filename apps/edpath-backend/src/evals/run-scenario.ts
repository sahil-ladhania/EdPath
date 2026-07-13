/**
 * Eval scenario driver — replays a scripted EvalScript against a fresh graph.
 * Captures state snapshots and assist transcripts step-by-step for evaluate-case.
*/
import { Command } from "@langchain/langgraph";
import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";
import { createEdPathGraph } from "../agent/graph.js";
import { seedGraphState } from "../agent/state/graph-update.js";
import type { GraphState } from "../agent/state/annotation.js";
import type { MCQ } from "@repo/types";
import type { ApprovalScript, AssistTurnRecord, EvalCase, EvalScriptStep, ScenarioRunResult, ScenarioSnapshot } from "./types.js";

// Define the function to snapshot the state
function snapshotState(state: GraphState): ScenarioSnapshot {
  // Return the snapshot
  return {
    phase: state.phase,
    currentObjectiveIndex: state.currentObjectiveIndex,
    currentQuestionIndex: state.currentQuestionIndex,
    attempts: state.attempts,
    resultsLength: state.results.length,
    helpTurnsUsed: state.helpTurnsUsed,
  };
};

// Define the function to resolve the wrong index
function resolveWrongIndex(mcq: MCQ): number {
  // Iterate the options
  for (let i = 0; i < mcq.options.length; i++) {
    // Check if the index is not the correct index
    if (i !== mcq.correctIndex) {
      return i;
    };
  };

  // Return the first index
  return 0;
};

// Define the function to resolve the answer index
function resolveAnswerIndex( step: Extract<EvalScriptStep, { kind: "answer" }>, mcq: MCQ ): number {
  // Check if the selected index is correct
  if (step.selectedIndex === "correct") {
    return mcq.correctIndex;
  };

  // Check if the selected index is wrong
  if (step.selectedIndex === "wrong") {
    return resolveWrongIndex(mcq);
  };

  // Return the selected index
  return step.selectedIndex;
};

// Define the function to convert the approval resume
function toApprovalResume(approve: ApprovalScript): Record<string, unknown> {
  // Check if the decision is changes
  if (approve.decision === "changes") {
    // Return the changes decision
    return { decision: "changes", note: approve.note };
  };

  return { decision: "approve" };
};

// Define the function to collect the MCQs
function collectMcqs( collected: MCQ[], questions: MCQ[] ): MCQ[] {
  // Initialize the seen set
  const seen = new Set(collected.map((q) => q.questionId));

  // Initialize the merged array
  const merged = [...collected];

  // Iterate the questions
  for (const mcq of questions) {
    // Check if the question ID is not in the seen set
    if (!seen.has(mcq.questionId)) {
      // Add the question ID to the seen set
      seen.add(mcq.questionId);
      // Add the MCQ to the merged array
      merged.push(mcq);
    };
  };

  // Return the merged array
  return merged;
};

// Define the function to get the current MCQ
async function getCurrentMcq( graph: ReturnType<typeof createEdPathGraph>, config: { configurable: { thread_id: string } } ): Promise<MCQ | null> {
  // Get the state
  const state = await graph.getState(config);

  // Get the current question index
  const idx = state.values.currentQuestionIndex;

  // Return the current MCQ or null
  return state.values.questions[idx] ?? null;
};

// Define the function to advance if resolved
async function advanceIfResolved( graph: ReturnType<typeof createEdPathGraph>, config: { configurable: { thread_id: string } } ): Promise<void> {
  // Get the state
  const state = await graph.getState(config);

  // Get the feedback
  const feedback = state.values.feedback;

  // Check if the feedback is not null and the can retry is false
  if (feedback && feedback.canRetry === false) {
    // Invoke the advance command
    await graph.invoke(
      new Command({ resume: { kind: "advance" } }),
      config,
    );
  };
};

// Define the function to run the complete all correct
async function runCompleteAllCorrect( graph: ReturnType<typeof createEdPathGraph>, config: { configurable: { thread_id: string } }, onQuestions?: (questions: MCQ[]) => void ): Promise<void> {
  // Get the initial state
  const initialState = await graph.getState(config);

  // Get the plan
  const plan = initialState.values.plan;

  // Get the objective count
  const objectiveCount = plan?.objectives.length ?? 0;

  // Get the total questions
  const totalQuestions = objectiveCount * 3;

  // Initialize the answered count
  let answered = 0;

  // Initialize the safety count
  let safety = 0;

  // While the answered count is less than the total questions and the safety count is less than the total questions + 10
  while (answered < totalQuestions && safety < totalQuestions + 10) {
    // Increment the safety count
    safety += 1;

    // Get the state
    const state = await graph.getState(config);

    // Check if the phase is complete
    if (state.values.phase === "complete") {
      break;
    };

    // Get the current MCQ
    const mcq = state.values.questions[state.values.currentQuestionIndex];

    // Check if the MCQ is null
    if (!mcq) {
      break;
    };

    // Call the on questions callback
    onQuestions?.(state.values.questions);

    // Invoke the answer command
    await graph.invoke(
      new Command({
        resume: { kind: "answer", selectedIndex: mcq.correctIndex },
      }),
      config,
    );

    // Advance if resolved
    await advanceIfResolved(graph, config);

    // Increment the answered count
    answered += 1;
  };
};

// Define the function to process the step
async function processStep( graph: ReturnType<typeof createEdPathGraph>, config: { configurable: { thread_id: string } },step: EvalScriptStep,
  context: {
    snapshots: ScenarioSnapshot[];
    helpTranscripts: GraphState["helpThread"][];
    assistTurns: AssistTurnRecord[];
    checkpointState: GraphState | null;
  },
): Promise<GraphState | null> {

  // Check if the step kind is checkpoint
  if (step.kind === "checkpoint") {
    // Check if the action is save
    if (step.action === "save") {
      // Get the current state
      const current = await graph.getState(config);

      // Return the current state
      return { ...current.values };
    };

    // Return the checkpoint state
    return context.checkpointState;
  };

  // Check if the step kind is approve
  if (step.kind === "approve") {
    // Define the resume
    const resume = step.decision === "changes" ? 
                                              { decision: "changes", note: step.note ?? "" }
                                              : 
                                              { decision: "approve" };

    // Invoke the approve command
    await graph.invoke(new Command({ resume }), config);

    // Get the state
    const state = await graph.getState(config);

    // Add the snapshot
    context.snapshots.push(snapshotState(state.values));

    // Return null
    return null;
  };

  // Check if the step kind is help
  if (step.kind === "help") {
    // Get the before help state
    const beforeHelp = await graph.getState(config);

    // Get the current MCQ
    const mcq = beforeHelp.values.questions[beforeHelp.values.currentQuestionIndex];
    
    // Add the help transcripts
    context.helpTranscripts.push([...beforeHelp.values.helpThread]);

    // Invoke the help command
    await graph.invoke(
      new Command({ resume: { kind: "help", text: step.text } }),
      config,
    );

    // Get the after help state
    const afterHelp = await graph.getState(config);

    // Add the after help help transcripts
    context.helpTranscripts.push([...afterHelp.values.helpThread]);

    // Add the after help snapshot
    context.snapshots.push(snapshotState(afterHelp.values));

    // Get the assistant message
    const assistantMessage = afterHelp.values.helpThread
      .filter((m: { role: string; content: string }) => m.role === "assistant")
      .at(-1)?.content;

    // Check if the MCQ and assistant message are not null
    if (mcq && assistantMessage) {
      context.assistTurns.push({
        questionId: mcq.questionId,
        userMessage: step.text,
        assistantMessage,
        mcq,
      });
    };

    // Return null
    return null;
  };

  // Get the current MCQ
  const mcq = await getCurrentMcq(graph, config);

  // Check if the MCQ is null
  if (!mcq) {
    return null;
  };

  // Resolve the answer index
  const selectedIndex = resolveAnswerIndex(step, mcq);

  // Invoke the answer command
  await graph.invoke(
    new Command({ resume: { kind: "answer", selectedIndex } }),
    config,
  );;

  // Get the state
  const state = await graph.getState(config);

  // Add the snapshot
  context.snapshots.push(snapshotState(state.values));

  // Advance if resolved
  await advanceIfResolved(graph, config);
  return null;
};

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
