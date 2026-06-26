import { Command, INTERRUPT } from "@langchain/langgraph";
import { describe, expect, test, beforeEach, afterEach } from "vitest";

import { buildInitialEdPathState } from "../features/upload/build-initial-state.js";

import { FIXTURE_PDF_META, FIXTURE_PDF_TEXT } from "./__fixtures__/pdf-text.js";
import { createStubMcqs } from "./__fixtures__/stubs.js";
import { createEdPathGraph } from "./graph.js";
import { gradeAnswer, GradingError } from "./lib/grade-answer.js";
import { assertAssistFirewall, buildAssistInput } from "./lib/assist-input.js";
import { isSourceAnchored } from "./lib/source-anchor.js";
import { setUseStubMcqs } from "./nodes/generate-mcq.js";
import { setUseStubPlan } from "./nodes/plan.js";
import { assertCoAgentFirewall, toCoAgentState } from "./state/to-co-agent-state.js";
import { deriveScore } from "./state/derive-score.js";
import { MAX_ATTEMPTS } from "./state/constants.js";
import { createTestGraphInput, EDPATH_TEST_THREAD_ID } from "./test-helpers.js";
import { seedGraphState } from "./state/graph-update.js";
import type { GraphState } from "./state/annotation.js";

describe("toCoAgentState firewall", () => {
  test("strips firewalled MCQ fields from mirror", () => {
    const seed = buildInitialEdPathState({
      pdfText: FIXTURE_PDF_TEXT,
      pdfMeta: FIXTURE_PDF_META,
    });
    const full = {
      ...seed,
      plan: {
        objectives: [
          {
            objectiveId: "obj-1",
            title: "Test",
            description: "Desc",
            difficulty: "easy" as const,
          },
        ],
      },
      questions: createStubMcqs("obj-1"),
      phase: "awaiting_input" as const,
    };

    const mirror = toCoAgentState(full);
    assertCoAgentFirewall(mirror);
    expect(mirror.questions[0]).not.toHaveProperty("correctIndex");
    expect(JSON.stringify(mirror)).not.toContain("sourceQuote");
    expect(JSON.stringify(mirror)).not.toContain("pdfText");
  });
});

describe("gradeAnswer", () => {
  const mcq = createStubMcqs("obj-1")[0]!;

  test("returns correct on matching index", () => {
    const result = gradeAnswer({
      selectedIndex: mcq.correctIndex,
      mcq,
      priorAttempts: 0,
    });
    expect(result.verdict).toBe("correct");
    expect(result.firstTryCorrect).toBe(true);
    expect(result.attempts).toBe(1);
  });

  test("returns incorrect and tracks attempts", () => {
    const result = gradeAnswer({
      selectedIndex: 1,
      mcq,
      priorAttempts: 1,
    });
    expect(result.verdict).toBe("incorrect");
    expect(result.firstTryCorrect).toBe(false);
    expect(result.attempts).toBe(2);
  });

  test("throws GradingError on out-of-range index", () => {
    expect(() =>
      gradeAnswer({ selectedIndex: 99, mcq, priorAttempts: 0 }),
    ).toThrow(GradingError);
  });
});

describe("deriveScore", () => {
  test("derives retry-aware score from results", () => {
    const score = deriveScore([
      {
        objectiveId: "obj-1",
        questionId: "q-1",
        correct: true,
        attempts: 2,
        firstTryCorrect: false,
      },
      {
        objectiveId: "obj-1",
        questionId: "q-2",
        correct: true,
        attempts: 1,
        firstTryCorrect: true,
      },
    ]);
    expect(score).toEqual({ correct: 2, total: 2, firstTry: 1 });
  });
});

describe("source-anchor", () => {
  test("matches normalized quote in pdfText", () => {
    expect(
      isSourceAnchored(
        "Chlorophyll in chloroplasts absorbs sunlight",
        FIXTURE_PDF_TEXT,
      ),
    ).toBe(true);
  });

  test("rejects quote not in pdfText", () => {
    expect(isSourceAnchored("Quantum entanglement in black holes", FIXTURE_PDF_TEXT)).toBe(
      false,
    );
  });
});

describe("assist firewall", () => {
  test("buildAssistInput excludes answer fields", () => {
    const input = buildAssistInput(
      {
        ...seedGraphState(
          buildInitialEdPathState({
            pdfText: FIXTURE_PDF_TEXT,
            pdfMeta: FIXTURE_PDF_META,
          }),
        ),
        plan: {
          objectives: [
            {
              objectiveId: "obj-1",
              title: "Photosynthesis",
              description: "Desc",
              difficulty: "easy",
            },
          ],
        },
        questions: createStubMcqs("obj-1"),
        currentObjectiveIndex: 0,
        currentQuestionIndex: 0,
        helpTurnsUsed: 0,
      } as GraphState,
      "Give me a hint",
    );
    assertAssistFirewall(input);
    expect(input).not.toHaveProperty("correctIndex");
  });
});

describe("EdPath LangGraph agent", () => {
  beforeEach(() => {
    setUseStubPlan(true);
    setUseStubMcqs(true);
  });

  afterEach(() => {
    setUseStubPlan(false);
    setUseStubMcqs(false);
  });

  test("compiles and pauses at approval interrupt", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: EDPATH_TEST_THREAD_ID } };

    const stream = await graph.stream(createTestGraphInput(), config);
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const interruptChunk = chunks.find(
      (chunk) =>
        typeof chunk === "object" &&
        chunk !== null &&
        INTERRUPT in (chunk as Record<string, unknown>),
    ) as Record<string, unknown> | undefined;

    expect(interruptChunk?.[INTERRUPT]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: expect.objectContaining({ type: "approval" }),
        }),
      ]),
    );
  });

  test("resumes approval and reaches await_input interrupt", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-approve` } };

    await graph.invoke(createTestGraphInput(), config);

    const resumed = await graph.stream(
      new Command({ resume: { decision: "approve" } }),
      config,
    );

    let sawAwaitInput = false;
    for await (const chunk of resumed) {
      if (
        typeof chunk === "object" &&
        chunk !== null &&
        INTERRUPT in (chunk as Record<string, unknown>)
      ) {
        const interrupts = (chunk as Record<string, unknown>)[INTERRUPT] as Array<{
          value: { type: string };
        }>;
        if (interrupts.some((item) => item.value?.type === "await_input")) {
          sawAwaitInput = true;
        }
      }
    }

    expect(sawAwaitInput).toBe(true);
  });

  test("grades correct answer and advances", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-grade` } };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(new Command({ resume: { decision: "approve" } }), config);

    const mcq = createStubMcqs("obj-1")[0]!;
    await graph.invoke(
      new Command({ resume: { kind: "answer", selectedIndex: mcq.correctIndex } }),
      config,
    );

    const state = await graph.getState(config);
    expect(state.values.results).toHaveLength(1);
    expect(state.values.results[0]?.correct).toBe(true);
    expect(state.values.currentQuestionIndex).toBe(1);
    expect(state.values.coAgentSnapshot).toBeDefined();
    assertCoAgentFirewall(state.values.coAgentSnapshot);
  });

  test("incorrect answer allows retry without score penalty until resolved", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-retry` } };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(new Command({ resume: { decision: "approve" } }), config);

    const wrongIndex = 1;
    await graph.invoke(
      new Command({ resume: { kind: "answer", selectedIndex: wrongIndex } }),
      config,
    );

    let state = await graph.getState(config);
    expect(state.values.feedback?.verdict).toBe("incorrect");
    expect(state.values.results).toHaveLength(0);
    expect(state.values.attempts).toBe(1);

    const mcq = createStubMcqs("obj-1")[0]!;
    await graph.invoke(
      new Command({ resume: { kind: "answer", selectedIndex: mcq.correctIndex } }),
      config,
    );

    state = await graph.getState(config);
    expect(state.values.results).toHaveLength(1);
    expect(state.values.results[0]?.attempts).toBe(2);
    expect(state.values.results[0]?.correct).toBe(true);
    expect(state.values.score.correct).toBe(1);
  });

  test("exhausted after max attempts advances without correctIndex in feedback", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-exhaust` } };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(new Command({ resume: { decision: "approve" } }), config);

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await graph.invoke(
        new Command({ resume: { kind: "answer", selectedIndex: 1 } }),
        config,
      );
    }

    const state = await graph.getState(config);
    expect(state.values.results).toHaveLength(1);
    expect(state.values.results[0]?.correct).toBe(false);
    expect(state.values.results[0]?.attempts).toBe(MAX_ATTEMPTS);
    expect(state.values.currentQuestionIndex).toBe(1);
    expect(JSON.stringify(state.values.coAgentSnapshot)).not.toContain(
      '"correctIndex"',
    );
  });

  test("help turn routes through assist without leaking answer fields", async () => {
    const graph = createEdPathGraph();
    const config = {
      configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-help` },
    };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(new Command({ resume: { decision: "approve" } }), config);
    await graph.invoke(
      new Command({ resume: { kind: "help", text: "What concept applies here?" } }),
      config,
    );

    const state = await graph.getState(config);
    expect(state.values.helpTurnsUsed).toBe(1);
    expect(state.values.messages.length).toBeGreaterThanOrEqual(2);
    assertCoAgentFirewall(state.values.coAgentSnapshot);
  });

  test("approval changes routes back through replan", async () => {
    const graph = createEdPathGraph();
    const config = {
      configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-changes` },
    };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(
      new Command({
        resume: { decision: "changes", note: "Add more on cellular respiration" },
      }),
      config,
    );

    const state = await graph.getState(config);
    expect(state.values.plan).not.toBeNull();
    expect(state.values.approval?.decision).toBe("changes");
  });

  test("runs end-to-end to summary with stub content", async () => {
    const graph = createEdPathGraph();
    const config = { configurable: { thread_id: `${EDPATH_TEST_THREAD_ID}-e2e` } };

    await graph.invoke(createTestGraphInput(), config);
    await graph.invoke(new Command({ resume: { decision: "approve" } }), config);

    const plan = (await graph.getState(config)).values.plan;
    const objectiveCount = plan?.objectives.length ?? 0;
    const questionsPerObjective = 3;
    const totalQuestions = objectiveCount * questionsPerObjective;

    for (let q = 0; q < totalQuestions; q++) {
      const state = await graph.getState(config);
      const mcq = state.values.questions[state.values.currentQuestionIndex];
      if (!mcq) {
        break;
      }
      await graph.invoke(
        new Command({
          resume: { kind: "answer", selectedIndex: mcq.correctIndex },
        }),
        config,
      );
    }

    const finalState = await graph.getState(config);
    expect(finalState.values.phase).toBe("complete");
    expect(finalState.values.summary).not.toBeNull();
    expect(finalState.values.results).toHaveLength(totalQuestions);
    assertCoAgentFirewall(finalState.values.coAgentSnapshot);
  }, 60_000);
});
