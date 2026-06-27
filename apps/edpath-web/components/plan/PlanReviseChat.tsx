"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareTextIcon, SendIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface PlanReviseChatProps {
  onClose: () => void;
  canSubmitRevision: boolean;
  isSubmitting: boolean;
  onSubmitRevision: (text: string) => void;
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Tell me how you'd like this lesson path to change — reorder objectives, adjust difficulty, add a topic, or remove something. Each send regenerates the roadmap above.",
};

const SUGGESTED_PROMPTS = [
  "Make the first objective easier to start with.",
  "Add an objective about practical examples.",
  "Remove the hardest objective for now.",
] as const;

function PlanRevisingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <p className="rounded-lg bg-paper px-3 py-2 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1">
          Revising your lesson path
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
          </span>
        </span>
      </p>
    </div>
  );
}

export function PlanReviseChat({
  onClose,
  canSubmitRevision,
  isSubmitting,
  onSubmitRevision,
}: PlanReviseChatProps): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [draft, setDraft] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputDisabled = !canSubmitRevision || isSubmitting;
  const showRevisingIndicator = useMemo((): boolean => {
    if (!isSubmitting) {
      return false;
    }

    const lastMessage = messages.at(-1);
    return lastMessage?.role === "user";
  }, [isSubmitting, messages]);

  const scrollToLatest = useCallback((): void => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToLatest();
  }, [scrollToLatest, messages, isSubmitting, showRevisingIndicator]);

  const submitDraft = useCallback(
    (content: string): void => {
      const trimmed = content.trim();

      if (!trimmed || inputDisabled) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
        },
      ]);
      setDraft("");
      onSubmitRevision(trimmed);
      window.requestAnimationFrame(scrollToLatest);
    },
    [inputDisabled, onSubmitRevision, scrollToLatest],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      submitDraft(draft);
    },
    [draft, submitDraft],
  );

  const showSuggestedPrompts = messages.length === 1 && !isSubmitting;

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary-soft/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon icon={MessageSquareTextIcon} size="sm" variant="brand" />
            Chat about your path
          </p>
          <p className="text-xs leading-snug text-ink-muted">
            Describe the changes you want. Each send regenerates the full
            roadmap above — keep going until you are satisfied, then approve.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close revise chat"
          onClick={onClose}
        >
          <Icon icon={XIcon} size="sm" />
        </Button>
      </div>

      <div
        ref={listRef}
        className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <p
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-snug",
                message.role === "assistant"
                  ? "bg-paper text-ink"
                  : "bg-primary text-white",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}
        {showRevisingIndicator ? <PlanRevisingIndicator /> : null}
      </div>

      {showSuggestedPrompts ? (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={inputDisabled}
              onClick={() => submitDraft(prompt)}
              className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          rows={3}
          value={draft}
          disabled={inputDisabled}
          placeholder="e.g. Start with basics, then move to advanced topics…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitDraft(draft);
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={inputDisabled || draft.trim().length === 0}
          >
            <Icon icon={SendIcon} size="sm" variant="inverse" />
            {isSubmitting ? "Revising…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
