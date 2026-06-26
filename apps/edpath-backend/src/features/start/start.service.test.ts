import { beforeEach, describe, expect, test, vi } from "vitest";

import { VALID_TEXT_PDF } from "../upload/test-fixtures.js";
import type { UploadLimits } from "../upload/upload.types.js";

const DEFAULT_LIMITS: UploadLimits = {
  maxBinaryBytes: 15 * 1024 * 1024,
  maxCleanChars: 200_000,
  maxTokens: 50_000,
  maxPages: 50,
  minCleanChars: 200,
  minCharsPerPage: 30,
};

const VALID_THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

vi.mock("../upload/upload.service.js", () => ({
  processUpload: vi.fn(),
}));

vi.mock("../../lib/langgraph/deployment-client.js", () => ({
  seedLessonThread: vi.fn(),
  ThreadAlreadyStartedError: class ThreadAlreadyStartedError extends Error {
    constructor(threadId: string) {
      super(`Thread "${threadId}" already has a seeded lesson.`);
      this.name = "ThreadAlreadyStartedError";
    }
  },
  LangGraphDeploymentError: class LangGraphDeploymentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "LangGraphDeploymentError";
    }
  },
}));

import { processUpload } from "../upload/upload.service.js";
import { seedLessonThread } from "../../lib/langgraph/deployment-client.js";
import {
  InvalidThreadIdError,
  isValidThreadId,
  startLesson,
} from "./start.service.js";

const mockedProcessUpload = vi.mocked(processUpload);
const mockedSeedLessonThread = vi.mocked(seedLessonThread);

describe("isValidThreadId", () => {
  test("accepts UUID v4", () => {
    expect(isValidThreadId(VALID_THREAD_ID)).toBe(true);
  });

  test("rejects non-UUID strings", () => {
    expect(isValidThreadId("not-a-uuid")).toBe(false);
    expect(isValidThreadId("")).toBe(false);
  });
});

describe("startLesson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("throws InvalidThreadIdError before upload", async () => {
    await expect(
      startLesson({
        threadId: "bad-id",
        file: {
          buffer: VALID_TEXT_PDF,
          originalname: "lesson.pdf",
          mimetype: "application/pdf",
          size: VALID_TEXT_PDF.length,
        },
        limits: DEFAULT_LIMITS,
      }),
    ).rejects.toBeInstanceOf(InvalidThreadIdError);

    expect(mockedProcessUpload).not.toHaveBeenCalled();
    expect(mockedSeedLessonThread).not.toHaveBeenCalled();
  });

  test("returns typed rejection without seeding", async () => {
    mockedProcessUpload.mockResolvedValue({
      ok: false,
      uploadResult: {
        status: "rejected",
        reason: "empty",
        message: "This PDF has no usable text.",
      },
    });

    const result = await startLesson({
      threadId: VALID_THREAD_ID,
      file: {
        buffer: VALID_TEXT_PDF,
        originalname: "empty.pdf",
        mimetype: "application/pdf",
        size: VALID_TEXT_PDF.length,
      },
      limits: DEFAULT_LIMITS,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.uploadResult).toEqual({
      status: "rejected",
      reason: "empty",
      message: "This PDF has no usable text.",
    });
    expect(mockedSeedLessonThread).not.toHaveBeenCalled();
  });

  test("seeds graph state and returns accepted UploadResult without pdfText", async () => {
    mockedProcessUpload.mockResolvedValue({
      ok: true,
      pdfText: "Grounded lesson text about photosynthesis.",
      pdfMeta: {
        filename: "lesson-source.pdf",
        charCount: 42,
        pageCount: 1,
      },
      uploadResult: {
        status: "accepted",
        pdfMeta: {
          filename: "lesson-source.pdf",
          charCount: 42,
          pageCount: 1,
        },
      },
    });

    const result = await startLesson({
      threadId: VALID_THREAD_ID,
      file: {
        buffer: VALID_TEXT_PDF,
        originalname: "lesson-source.pdf",
        mimetype: "application/pdf",
        size: VALID_TEXT_PDF.length,
      },
      limits: DEFAULT_LIMITS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.uploadResult).toEqual({
      status: "accepted",
      pdfMeta: {
        filename: "lesson-source.pdf",
        charCount: 42,
        pageCount: 1,
      },
    });
    expect(result.uploadResult).not.toHaveProperty("pdfText");
    expect(JSON.stringify(result.uploadResult)).not.toContain("pdfText");

    expect(mockedSeedLessonThread).toHaveBeenCalledOnce();
    const seedCall = mockedSeedLessonThread.mock.calls[0]?.[0];
    expect(seedCall?.threadId).toBe(VALID_THREAD_ID);
    expect(seedCall?.seed.pdfText).toBe("Grounded lesson text about photosynthesis.");
    expect(seedCall?.seed.phase).toBe("planning");
    expect(seedCall?.seed.coAgentSnapshot).toBeDefined();
  });

  test("propagates ThreadAlreadyStartedError from seeding", async () => {
    mockedProcessUpload.mockResolvedValue({
      ok: true,
      pdfText: "Grounded lesson text.",
      pdfMeta: {
        filename: "lesson.pdf",
        charCount: 22,
        pageCount: 1,
      },
      uploadResult: {
        status: "accepted",
        pdfMeta: {
          filename: "lesson.pdf",
          charCount: 22,
          pageCount: 1,
        },
      },
    });

    const { ThreadAlreadyStartedError } = await import(
      "../../lib/langgraph/deployment-client.js"
    );
    mockedSeedLessonThread.mockRejectedValue(
      new ThreadAlreadyStartedError(VALID_THREAD_ID),
    );

    await expect(
      startLesson({
        threadId: VALID_THREAD_ID,
        file: {
          buffer: VALID_TEXT_PDF,
          originalname: "lesson.pdf",
          mimetype: "application/pdf",
          size: VALID_TEXT_PDF.length,
        },
        limits: DEFAULT_LIMITS,
      }),
    ).rejects.toBeInstanceOf(ThreadAlreadyStartedError);
  });
});
