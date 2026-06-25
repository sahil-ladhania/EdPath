"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Objective } from "@/types/lesson.types";

interface PlanActionsProps {
  objectives: Objective[];
  onApprove: () => void;
  onSaveObjectives: (objectives: Objective[]) => void;
}

export function PlanActions({
  objectives,
  onApprove,
  onSaveObjectives,
}: PlanActionsProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [draftObjectives, setDraftObjectives] = useState<Objective[]>(objectives);

  function updateDraft(
    objectiveId: string,
    field: "title" | "description",
    value: string,
  ): void {
    setDraftObjectives((currentDraft) =>
      currentDraft.map((objective) =>
        objective.objectiveId === objectiveId
          ? {
              ...objective,
              [field]: value,
            }
          : objective,
      ),
    );
  }

  function saveDraft(): void {
    onSaveObjectives(draftObjectives);
    setIsOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" onClick={onApprove}>
        Approve lesson plan
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setDraftObjectives(objectives)}
          >
            Edit objectives
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit objective copy</DialogTitle>
            <DialogDescription>
              This dialog is a local mock for the Edit-then-approve path. The
              real revision loop will feed back into the planning node later.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {draftObjectives.map((objective, index) => (
              <div
                key={objective.objectiveId}
                className="space-y-3 rounded-lg border border-border bg-paper p-4"
              >
                <p className="text-sm font-semibold text-ink">
                  Objective {index + 1}
                </p>
                <Input
                  value={objective.title}
                  onChange={(event) =>
                    updateDraft(objective.objectiveId, "title", event.target.value)
                  }
                />
                <Textarea
                  value={objective.description}
                  onChange={(event) =>
                    updateDraft(
                      objective.objectiveId,
                      "description",
                      event.target.value,
                    )
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDraft}>Save edits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button size="lg" variant="secondary" disabled>
        Chat to revise - CopilotKit next session
      </Button>
    </div>
  );
}
