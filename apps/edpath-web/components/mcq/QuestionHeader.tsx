"use client";

import { Badge } from "@/components/ui/badge";

interface QuestionHeaderProps {
  objectiveTitle: string;
  questionNumber: number;
  questionCount: number;
  attemptNumber: number;
  maxAttempts: number;
}

export function QuestionHeader({
  objectiveTitle,
  questionNumber,
  questionCount,
  attemptNumber,
  maxAttempts,
}: QuestionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-primary">
          Current objective
        </p>
        <h2 className="font-display text-3xl text-ink">{objectiveTitle}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Question {questionNumber} of {questionCount}</Badge>
        <Badge variant="outline">Attempt {attemptNumber} of {maxAttempts}</Badge>
      </div>
    </div>
  );
}
