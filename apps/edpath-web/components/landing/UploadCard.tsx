"use client";

// Import React and types
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, FileTextIcon, PlayIcon } from "lucide-react";
import type { UploadResult } from "@repo/types";
import { UploadGuidelines } from "@/components/landing/UploadGuidelines";
import { UploadStateBanner } from "@/components/landing/UploadStateBanner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createThreadId, rememberThreadId } from "@/lib/lesson-handoff";
import { startLessonPdf } from "@/api/start-api";
import { uploadPdf } from "@/api/upload-api";
import type { UploadBannerState } from "@/types/landing";

// Function to render the upload card
export function UploadCard() {
  // useRouter Hook to get the router
  const router = useRouter();
  // useRef Hook to store the input reference
  const inputRef = useRef<HTMLInputElement | null>(null);
  // useState Hook to store the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // useState Hook to store the dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // useState Hook to store the uploading state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // useState Hook to store the starting lesson state
  const [isStartingLesson, setIsStartingLesson] = useState<boolean>(false);
  // useState Hook to store the upload result
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  // useState Hook to store the transport error
  const [transportError, setTransportError] = useState<string | null>(null);

  // Check if the upload is busy
  const isBusy = isUploading || isStartingLesson;

  // useMemo Hook to store the status
  const status = useMemo<UploadBannerState>(() => {
    // Check if the starting lesson is true
    if (isStartingLesson) {
      // Return the loading status
      return {
        tone: "loading",
        message: "Building your lesson path...",
      };
    };

    // Check if the uploading is true
    if (isUploading) {
      // Return the loading status
      return {
        tone: "loading",
        message: "Checking your PDF...",
      };
    };

    // Check if the transport error is not null
    if (transportError) {
      // Return the error status
      return {
        tone: "error",
        message: transportError,
      };
    };

    // Check if the upload result is not null
    if (!uploadResult) {
      // Return the idle status
      return {
        tone: "idle",
        message: "",
      };
    };

    // Check if the upload result status is rejected
    if (uploadResult.status === "rejected") {
      // Return the error status
      return {
        tone: "error",
        message: uploadResult.message,
      };
    };

    // Return the success status
    return {
      tone: "success",
      message: "PDF ready. Start the lesson when you're ready to review the path.",
    };
  }, [isStartingLesson, isUploading, transportError, uploadResult]);

  // Check if the upload result status is accepted
  const acceptedUpload = uploadResult?.status === "accepted" ? uploadResult : null;

  // Check if the status tone is not idle
  const showStatusBanner = status.tone !== "idle";

  // Function to validate and store the file
  async function validateAndStore(file: File): Promise<void> {
    // Set the transport error to null
    setTransportError(null);
    // Set the upload result to null
    setUploadResult(null);
    // Set the selected file to null
    setSelectedFile(null);
    // Set the uploading state to true
    setIsUploading(true);

    // Upload the file
    const outcome = await uploadPdf(file);

    // Set the uploading state to false
    setIsUploading(false);

    // Check if the outcome kind is transport error
    if (outcome.kind === "transport_error") {
      // Set the transport error to the outcome message
      setTransportError(outcome.message);
      return;
    };

    // Check if the outcome result status is rejected
    if (outcome.result.status === "rejected") {
      // Set the upload result to the outcome result
      setUploadResult(outcome.result);
      return;
    };

    // Set the selected file to the file
    setSelectedFile(file);
    // Set the upload result to the outcome result
    setUploadResult(outcome.result);
  };

  // Function to handle the files
  function handleFiles(files: FileList | null): void {
    // Check if the files is null or the length is 0 or the upload is busy
    if (!files || files.length === 0 || isBusy) {
      return;
    };

    // Get the first file
    const file = files.item(0);

    // Check if the file is null
    if (!file) {
      return;
    };

    // Validate and store the file
    void validateAndStore(file);
  };

  // Function to handle the start lesson
  async function handleStartLesson(): Promise<void> {
    // Check if the selected file is null or the accepted upload is null
    if (!selectedFile || !acceptedUpload) {
      // Set the transport error to null
      setTransportError(null);
      // Set the upload result to the rejected status
      setUploadResult({
        status: "rejected",
        reason: "empty",
        message: "Choose a PDF first.",
      });
      return;
    };

    // Create a new thread id
    const threadId = createThreadId();

    // Set the transport error to null
    setTransportError(null);
    // Set the starting lesson state to true
    setIsStartingLesson(true);

    // Start the lesson pdf
    const outcome = await startLessonPdf(selectedFile, threadId);
    // Set the starting lesson state to false
    setIsStartingLesson(false);

    // Check if the outcome kind is transport error
    if (outcome.kind === "transport_error") {
      // Set the transport error to the outcome message
      setTransportError(outcome.message);
      return;
    };

    // Check if the outcome result status is rejected
    if (outcome.result.status === "rejected") {
      // Set the upload result to the outcome result
      setUploadResult(outcome.result);
      return;
    };

    // Remember the thread id
    rememberThreadId(threadId);
    // Push the lesson route
    router.push(`/lesson/${threadId}`);
  };

  // Return the upload card
  return (
    <Card className="w-full border-border bg-surface shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon icon={FileUpIcon} size="sm" variant="brand" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-base font-semibold text-ink">
            Upload PDF
          </CardTitle>
          <p className="text-sm text-ink-muted">PDF only · one file at a time</p>
        </div>
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
                : "cursor-pointer",
              !isBusy && isDragging
                ? "border-primary bg-primary-soft"
                : !isBusy
                  ? "border-border hover:border-primary hover:bg-primary-soft/60"
                  : "border-border",
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
};