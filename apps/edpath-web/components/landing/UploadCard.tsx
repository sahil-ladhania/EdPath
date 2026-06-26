"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, FileTextIcon } from "lucide-react";
import type { UploadResult } from "@repo/types";

import { UploadStateBanner } from "@/components/landing/UploadStateBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createThreadId,
  rememberThreadId,
} from "@/lib/lesson-handoff";
import { startLessonPdf } from "@/lib/start-api";
import { uploadPdf } from "@/lib/upload-api";

interface UploadBannerState {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
}

export function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isStartingLesson, setIsStartingLesson] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);

  const isBusy = isUploading || isStartingLesson;

  const status = useMemo<UploadBannerState>(() => {
    if (isStartingLesson) {
      return {
        tone: "loading",
        message: "Building your lesson path...",
      };
    }

    if (isUploading) {
      return {
        tone: "loading",
        message: "Checking your PDF...",
      };
    }

    if (transportError) {
      return {
        tone: "error",
        message: transportError,
      };
    }

    if (!uploadResult) {
      return {
        tone: "idle",
        message:
          "Choose one PDF to build a focused lesson path from its contents.",
      };
    }

    if (uploadResult.status === "rejected") {
      return {
        tone: "error",
        message: uploadResult.message,
      };
    }

    return {
      tone: "success",
      message:
        "PDF ready. Start the lesson when you're ready to review the path.",
    };
  }, [
    isStartingLesson,
    isUploading,
    transportError,
    uploadResult,
  ]);

  const acceptedUpload =
    uploadResult?.status === "accepted" ? uploadResult : null;

  async function validateAndStore(file: File): Promise<void> {
    setTransportError(null);
    setUploadResult(null);
    setSelectedFile(null);
    setIsUploading(true);

    const outcome = await uploadPdf(file);

    setIsUploading(false);

    if (outcome.kind === "transport_error") {
      setTransportError(outcome.message);
      return;
    }

    if (outcome.result.status === "rejected") {
      setUploadResult(outcome.result);
      return;
    }

    setSelectedFile(file);
    setUploadResult(outcome.result);
  }

  function handleFiles(files: FileList | null): void {
    if (!files || files.length === 0 || isBusy) {
      return;
    }

    const file = files.item(0);

    if (!file) {
      return;
    }

    void validateAndStore(file);
  }

  async function handleStartLesson(): Promise<void> {
    if (!selectedFile || !acceptedUpload) {
      setTransportError(null);
      setUploadResult({
        status: "rejected",
        reason: "empty",
        message: "Choose a PDF first.",
      });
      return;
    }

    const threadId = createThreadId();

    setTransportError(null);
    setIsStartingLesson(true);

    const outcome = await startLessonPdf(selectedFile, threadId);

    setIsStartingLesson(false);

    if (outcome.kind === "transport_error") {
      setTransportError(outcome.message);
      return;
    }

    if (outcome.result.status === "rejected") {
      setUploadResult(outcome.result);
      return;
    }

    rememberThreadId(threadId);
    router.push(`/lesson/${threadId}`);
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-border bg-surface shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-2xl font-semibold tracking-[var(--tracking-display)]">
          Upload your source PDF
        </CardTitle>
        <CardDescription>
          One bounded document becomes one structured lesson with a plan,
          questions, feedback, and a final study report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={isBusy}
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            if (isBusy) {
              return;
            }

            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={[
            "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-paper px-6 py-10 text-center transition-colors",
            isBusy
              ? "cursor-not-allowed opacity-60"
              : isDragging
                ? "border-primary bg-primary-soft"
                : "border-border hover:border-primary hover:bg-primary-soft/60",
          ].join(" ")}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
            <FileUpIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-ink">
              Drag a PDF here or click to choose one
            </p>
            <p className="text-sm text-ink-muted">
              PDF only · under 15 MB · selectable text required.
            </p>
          </div>
        </button>

        {selectedFile && acceptedUpload ? (
          <div className="rounded-lg border border-border bg-paper px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileTextIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ink">{selectedFile.name}</p>
                <p className="text-sm text-ink-muted">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ~
                  {acceptedUpload.pdfMeta.pageCount} pages · ~
                  {acceptedUpload.pdfMeta.charCount.toLocaleString()} cleaned
                  characters
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <UploadStateBanner tone={status.tone} message={status.message} />
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Your file is used to create one lesson.
        </p>
        <Button
          size="lg"
          onClick={handleStartLesson}
          disabled={!selectedFile || isBusy}
        >
          Start lesson
        </Button>
      </CardFooter>
    </Card>
  );
}
