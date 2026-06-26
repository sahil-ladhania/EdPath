"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, FileTextIcon } from "lucide-react";

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

interface UploadCardState {
  tone: "idle" | "error" | "success" | "loading";
  message: string;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function estimateCharacterCount(file: File): number {
  return Math.round(file.size * 0.7);
}

export function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [status, setStatus] = useState<UploadCardState>({
    tone: "idle",
    message:
      "Choose one PDF to build a focused lesson path from its contents.",
  });

  const fileMeta = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return {
      sizeInMb: (selectedFile.size / (1024 * 1024)).toFixed(2),
      estimatedCharacters: estimateCharacterCount(selectedFile).toLocaleString(),
      estimatedPages: Math.max(1, Math.round(selectedFile.size / 120000)),
    };
  }, [selectedFile]);

  function validateAndStore(file: File): void {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setSelectedFile(null);
      setStatus({
        tone: "error",
        message: "Upload a single PDF file. Other file types are rejected.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setStatus({
        tone: "error",
        message:
          "This PDF is too large for one focused lesson. Choose a file under 15 MB.",
      });
      return;
    }

    if (/scan|image/i.test(file.name)) {
      setSelectedFile(null);
      setStatus({
        tone: "error",
        message:
          "This looks like a scanned or image-only PDF. Choose a PDF with selectable text.",
      });
      return;
    }

    setSelectedFile(file);
    setStatus({
      tone: "success",
      message: "PDF ready. Start the lesson when you're ready to review the path.",
      });
  }

  function handleFiles(files: FileList | null): void {
    if (!files || files.length === 0) {
      return;
    }

    validateAndStore(files[0]);
  }

  function handleStartLesson(): void {
    if (!selectedFile) {
      setStatus({
        tone: "error",
        message: "Choose a PDF first.",
      });
      return;
    }

    setStatus({
      tone: "loading",
      message: "Building your lesson path...",
    });

    window.setTimeout(() => {
      router.push("/lesson/mock-thread-1");
    }, 550);
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-border shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Upload your source PDF</CardTitle>
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
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
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
            isDragging
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

        {selectedFile && fileMeta ? (
          <div className="rounded-lg border border-border bg-paper px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileTextIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ink">{selectedFile.name}</p>
                <p className="text-sm text-ink-muted">
                  {fileMeta.sizeInMb} MB · ~{fileMeta.estimatedPages} pages · ~
                  {fileMeta.estimatedCharacters} cleaned characters
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
          disabled={!selectedFile || status.tone === "loading"}
        >
          Start lesson
        </Button>
      </CardFooter>
    </Card>
  );
}
