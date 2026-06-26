import { Command, INTERRUPT } from "@langchain/langgraph";
import { describe, expect, test } from "vitest";

import {
  createWalkingSkeletonGraph,
  createWalkingSkeletonState,
  WALKING_SKELETON_THREAD_ID,
} from "./walking-skeleton.js";

describe("walking skeleton LangGraph stub", () => {
  test("creates only the redacted CoAgentState mirror", () => {
    const state = createWalkingSkeletonState();

    expect(state.phase).toBe("awaiting_approval");
    expect(state.plan?.objectives).toHaveLength(1);
    expect(state.questions).toHaveLength(1);
    expect(state.questions[0]).toEqual({
      questionId: "stub-question-1",
      objectiveId: "stub-objective-1",
      question: "Which placeholder step comes after approving the stub plan?",
      options: [
        "Render the hardcoded quiz placeholder",
        "Parse a real PDF",
        "Generate real MCQs",
        "Grade a submitted answer",
      ],
    });
    expect(JSON.stringify(state)).not.toContain("correctIndex");
    expect(JSON.stringify(state)).not.toContain("sourceQuote");
  });

  test("pauses for fake approval and resumes to the quiz placeholder", async () => {
    const graph = createWalkingSkeletonGraph();
    const config = { configurable: { thread_id: WALKING_SKELETON_THREAD_ID } };

    const firstRun = await graph.stream({}, config);
    const firstChunks = [];
    for await (const chunk of firstRun) {
      firstChunks.push(chunk);
    }

    expect(firstChunks).toHaveLength(2);
    expect(firstChunks[0]).toEqual({
      initialize_stub_state: createWalkingSkeletonState(),
    });
    expect(firstChunks[1]).toMatchObject({
      [INTERRUPT]: [
        {
          value: {
            type: "approval",
            plan: createWalkingSkeletonState().plan,
          },
        },
      ],
    });

    const resumedRun = await graph.stream(
      new Command({ resume: { decision: "approve" } }),
      config,
    );
    const resumedChunks = [];
    for await (const chunk of resumedRun) {
      resumedChunks.push(chunk);
    }

    expect(resumedChunks).toContainEqual({
      approval_gate: {
        approval: { decision: "approve" },
        phase: "quizzing",
      },
    });
  });
});
