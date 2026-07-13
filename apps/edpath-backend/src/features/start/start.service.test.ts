/**
 * Start service tests — upload PDF, build seed, seed LangGraph thread.
**/
import { beforeEach, describe, expect, test, vi } from "vitest";
import { VALID_TEXT_PDF } from "../upload/test-fixtures.js";
import type { UploadLimits } from "../upload/upload.types.js";
import { processUpload } from "../upload/upload.service.js";
import { seedLessonThread } from "../../lib/langgraph/deployment-client.js";
import { InvalidThreadIdError, isValidThreadId, startLesson } from "./start.service.js";

// Define the default limits
const DEFAULT_LIMITS: UploadLimits = {
  maxBinaryBytes: 15 * 1024 * 1024,
  maxCleanChars: 200_000,
  maxTokens: 50_000,
  maxPages: 50,
  minCleanChars: 200,
  minCharsPerPage: 30,
};

// Define the valid thread id
const VALID_THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

// Mock the upload service
vi.mock("../upload/upload.service.js", () => ({
  processUpload: vi.fn(),
}));

// Mock the deployment client
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

// Mock the process upload function
const mockedProcessUpload = vi.mocked(processUpload);

// Mock the seed lesson thread function
const mockedSeedLessonThread = vi.mocked(seedLessonThread);

// Describe the isValidThreadId function
describe("isValidThreadId", () => {
  // Test that it accepts UUID v4
  test("accepts UUID v4", () => {
    expect(isValidThreadId(VALID_THREAD_ID)).toBe(true);
  });

  // Test that it rejects non-UUID strings
  test("rejects non-UUID strings", () => {
    expect(isValidThreadId("not-a-uuid")).toBe(false);
    expect(isValidThreadId("")).toBe(false);
  });
});

// Describe the startLesson function
describe("startLesson", () => {
  // Before each test, clear all mocks
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test that it throws an invalid thread id error before upload
  test("throws InvalidThreadIdError before upload", async () => {
    // Expect the start lesson function to throw an invalid thread id error
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

    // Expect the process upload function to not have been called
    expect(mockedProcessUpload).not.toHaveBeenCalled();

    // Expect the seed lesson thread function to not have been called
    expect(mockedSeedLessonThread).not.toHaveBeenCalled();
  });

  // Test that it returns a typed rejection without seeding
  test("returns typed rejection without seeding", async () => {
    // Mock the process upload function to return a rejected upload result
    mockedProcessUpload.mockResolvedValue({
      ok: false,
      uploadResult: {
        status: "rejected",
        reason: "empty",
        message: "This PDF has no usable text.",
      },
    });

    // Start the lesson
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

    // Expect the result to be a typed rejection
    expect(result.ok).toBe(false);

    // Check if the result is a typed rejection
    if (result.ok) {
      return;
    };

    // Expect the upload result to be a typed rejection
    expect(result.uploadResult).toEqual({
      status: "rejected",
      reason: "empty",
      message: "This PDF has no usable text.",
    });

    // Expect the seed lesson thread function to not have been called
    expect(mockedSeedLessonThread).not.toHaveBeenCalled();
  });

  // Test that it seeds graph state and returns accepted UploadResult without pdfText
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

    // Start the lesson
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

    // Expect the result to be a success
    expect(result.ok).toBe(true);
    // Check if the result is a success
    if (!result.ok) {
      return;
    };

    // Expect the upload result to be a typed acceptance
    expect(result.uploadResult).toEqual({
      status: "accepted",
      pdfMeta: {
        filename: "lesson-source.pdf",
        charCount: 42,
        pageCount: 1,
      },
    });
    // Expect the upload result to not have a pdfText property
    expect(result.uploadResult).not.toHaveProperty("pdfText");
    // Expect the upload result to not contain a pdfText property
    expect(JSON.stringify(result.uploadResult)).not.toContain("pdfText");

    // Expect the seed lesson thread function to have been called once
    expect(mockedSeedLessonThread).toHaveBeenCalledOnce();
    // Get the seed call
    const seedCall = mockedSeedLessonThread.mock.calls[0]?.[0];
    // Expect the seed call to have the correct thread id
    expect(seedCall?.threadId).toBe(VALID_THREAD_ID);
    // Expect the seed call to have the correct pdf text
    expect(seedCall?.seed.pdfText).toBe("Grounded lesson text about photosynthesis.");
    // Expect the seed call to have the correct phase
    expect(seedCall?.seed.phase).toBe("planning");
    // Expect the seed call to have the correct coAgentSnapshot
    expect(seedCall?.seed.coAgentSnapshot).toBeDefined();
  });

  // Test that it propagates ThreadAlreadyStartedError from seeding
  test("propagates ThreadAlreadyStartedError from seeding", async () => {
    // Mock the process upload function to return a successful upload result
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

    // Import the ThreadAlreadyStartedError class
    const { ThreadAlreadyStartedError } = await import("../../lib/langgraph/deployment-client.js");
    // Mock the seed lesson thread function to throw a thread already started error
    mockedSeedLessonThread.mockRejectedValue(
      new ThreadAlreadyStartedError(VALID_THREAD_ID),
    );

    // Expect the start lesson function to throw a thread already started error
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