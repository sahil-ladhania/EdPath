"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, FileTextIcon, PlayIcon } from "lucide-react";
import type { UploadResult } from "@repo/types";

import { UploadGuidelines } from "@/components/landing/UploadGuidelines";
import { UploadStateBanner } from "@/components/landing/UploadStateBanner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import {
  Card,
  CardContent,
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
        message: "",
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

  const showStatusBanner = status.tone !== "idle";

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
    <Card className="w-full border-border bg-surface shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-ink">
          Upload PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              "flex aspect-[5/2] w-full flex-row items-center justify-center gap-3 rounded-lg border border-dashed bg-paper px-4 py-5 text-center transition-colors sm:gap-4",
              isBusy
                ? "cursor-not-allowed opacity-60"
                : isDragging
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:border-primary hover:bg-primary-soft/60",
            ].join(" ")}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-[var(--shadow-xs)]">
              <Icon icon={FileUpIcon} size="sm" variant="brand" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink">Drop PDF here</p>
              <p className="text-xs text-ink-muted">or choose a file</p>
            </div>
          </button>

        {selectedFile && acceptedUpload ? (
          <div className="rounded-lg border border-border bg-paper px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon icon={FileTextIcon} size="sm" variant="brand" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate font-semibold text-ink">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-ink-muted">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ~
                  {acceptedUpload.pdfMeta.pageCount} pages
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {showStatusBanner ? (
          <UploadStateBanner tone={status.tone} message={status.message} />
        ) : null}

        <UploadGuidelines />

        <Button
          className="w-full"
          size="lg"
          onClick={handleStartLesson}
          disabled={!selectedFile || isBusy}
        >
          <Icon icon={PlayIcon} size="sm" variant="inverse" />
          Start lesson
        </Button>
      </CardContent>
    </Card>
  );
}
