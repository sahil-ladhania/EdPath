/**
 * EdPath LangGraph agent test suite.
 */
import { describe, expect, test, vi } from "vitest";
import type { CoAgentState } from "@repo/types";
import { EdPathLangGraphAgent } from "./edpath-langgraph-agent.js";

// Define the describe block for the EdPath LangGraph agent test suite
describe("EdPathLangGraphAgent.getStateSnapshot", () => {
  // Define the test for when the state snapshot is returned
  test("returns coAgentSnapshot mirror instead of full graph values", () => {
    const mirror: CoAgentState = {
      pdfMeta: { filename: "lesson.pdf", charCount: 100, pageCount: 1 },
      plan: {
        objectives: [
          {
            objectiveId: "obj-1",
            title: "Topic A",
            description: "From PDF",
            difficulty: "easy",
          },
        ],
      },
      approval: null,
      currentObjectiveIndex: 0,
      questions: [],
      currentQuestionIndex: 0,
      selectedIndex: null,
      attempts: 0,
      helpTurnsUsed: 0,
      helpThread: [],
      feedback: null,
      results: [],
      score: { correct: 0, total: 0, firstTry: 0 },
      summary: null,
      phase: "awaiting_approval",
      lastError: null,
    };

    const agent = Object.create(EdPathLangGraphAgent.prototype) as EdPathLangGraphAgent;
    vi.spyOn(
      Object.getPrototypeOf(EdPathLangGraphAgent.prototype),
      "getStateSnapshot",
    ).mockReturnValue({ messages: [] });

    const snapshot = agent.getStateSnapshot({
      values: {
        pdfText: "secret grounding text",
        coAgentSnapshot: mirror,
        questions: [{ correctIndex: 2 }],
      },
    } as unknown as Parameters<EdPathLangGraphAgent["getStateSnapshot"]>[0]);

    expect(snapshot).toEqual(mirror);
    expect(JSON.stringify(snapshot)).not.toContain("pdfText");
    expect(JSON.stringify(snapshot)).not.toContain("correctIndex");
  });
});