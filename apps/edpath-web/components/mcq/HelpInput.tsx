"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import type { HelpThreadMessage } from "@repo/types";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface HelpInputProps {
  thread: HelpThreadMessage[];
  helpTurnsUsed: number;
  maxHelp: number;
  canSubmitHelp: boolean;
  isSubmitting: boolean;
  onSubmitHelp: (text: string) => void;
}

const HELP_CAP_MESSAGE =
  "You've used all available help turns for this question. Take your best guess and submit an answer when you're ready.";

const SUGGESTED_PROMPTS = [
  "Explain the idea behind this question.",
  "What concept from the reading applies here?",
  "Give me a nudge without telling me the answer.",
] as const;

const TYPEWRITER_MS = 16;

interface DisplayMessage extends HelpThreadMessage {
  key: string;
  animate?: boolean;
}

function useTypewriter(
  text: string,
  enabled: boolean,
  onComplete?: () => void,
): string {
  const [visible, setVisible] = useState<string>(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setVisible(text);
      return;
    }

    setVisible("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
        onComplete?.();
      }
    }, TYPEWRITER_MS);

    return () => window.clearInterval(timer);
  }, [enabled, onComplete, text]);

  return visible;
}

function HelpThreadBubble({
  message,
  animate,
  onAnimationComplete,
}: {
  message: HelpThreadMessage;
  animate: boolean;
  onAnimationComplete?: () => void;
}): React.JSX.Element {
  const content = useTypewriter(message.content, animate, onAnimationComplete);

  return (
    <div
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
        {content}
        {animate && content.length < message.content.length ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink align-middle" />
        ) : null}
      </p>
    </div>
  );
}

function HelpTypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <p className="rounded-lg bg-paper px-3 py-2 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1">
          Thinking
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

export function HelpInput({
  thread,
  helpTurnsUsed,
  maxHelp,
  canSubmitHelp,
  isSubmitting,
  onSubmitHelp,
}: HelpInputProps): React.JSX.Element {
  const [draft, setDraft] = useState<string>("");
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [animatingAssistantKey, setAnimatingAssistantKey] = useState<
    string | null
  >(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousThreadLengthRef = useRef<number>(0);
  const atCap = helpTurnsUsed >= maxHelp;
  const inputDisabled = !canSubmitHelp || isSubmitting || atCap;

  const scrollToLatest = useCallback((): void => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!pendingUserText) {
      return;
    }

    const mirrored = thread.some(
      (message) =>
        message.role === "user" && message.content === pendingUserText,
    );

    if (mirrored) {
      setPendingUserText(null);
    }
  }, [pendingUserText, thread]);

  useEffect(() => {
    scrollToLatest();
  }, [scrollToLatest, thread, pendingUserText, isSubmitting]);

  const displayMessages = useMemo((): DisplayMessage[] => {
    const items: DisplayMessage[] = thread.map((message, index) => ({
      ...message,
      key: `server-${index}-${message.role}-${message.content.slice(0, 16)}`,
    }));

    if (
      pendingUserText &&
      !items.some(
        (message) =>
          message.role === "user" && message.content === pendingUserText,
      )
    ) {
      items.push({
        role: "user",
        content: pendingUserText,
        key: `pending-${pendingUserText}`,
      });
    }

    return items;
  }, [pendingUserText, thread]);

  useEffect(() => {
    if (thread.length === 0) {
      setAnimatingAssistantKey(null);
      setPendingUserText(null);
      previousThreadLengthRef.current = 0;
      return;
    }

    if (thread.length <= previousThreadLengthRef.current) {
      return;
    }

    const lastMessage = thread.at(-1);

    if (lastMessage?.role === "assistant") {
      const index = thread.length - 1;
      setAnimatingAssistantKey(
        `server-${index}-assistant-${lastMessage.content.slice(0, 16)}`,
      );
    }

    previousThreadLengthRef.current = thread.length;
  }, [thread]);

  const showTypingIndicator = useMemo((): boolean => {
    if (!isSubmitting) {
      return false;
    }

    const lastMessage = displayMessages.at(-1);
    return lastMessage?.role === "user";
  }, [displayMessages, isSubmitting]);

  const submitDraft = useCallback(
    (content: string): void => {
      const trimmed = content.trim();

      if (!trimmed || inputDisabled) {
        return;
      }

      setPendingUserText(trimmed);
      onSubmitHelp(trimmed);
      setDraft("");
    },
    [inputDisabled, onSubmitHelp],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      submitDraft(draft);
    },
    [draft, submitDraft],
  );

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-paper p-4">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon icon={MessageCircleIcon} size="sm" />
          Need a nudge?
        </p>
        <p className="text-sm text-ink-muted">
          Ask about the idea behind the question. The nudge will keep you with
          the same choices.
        </p>
        <p className="text-xs text-ink-muted">
          Help turns used: {helpTurnsUsed} / {maxHelp}
        </p>
      </div>

      {displayMessages.length > 0 || showTypingIndicator ? (
        <div
          ref={listRef}
          className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3"
          aria-live="polite"
        >
          {displayMessages.map((message) => (
            <HelpThreadBubble
              key={message.key}
              message={message}
              animate={
                message.role === "assistant" &&
                message.key === animatingAssistantKey
              }
              onAnimationComplete={() => {
                if (message.key === animatingAssistantKey) {
                  setAnimatingAssistantKey(null);
                }
              }}
            />
          ))}
          {showTypingIndicator ? <HelpTypingIndicator /> : null}
        </div>
      ) : null}

      {atCap ? (
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-muted">
          {HELP_CAP_MESSAGE}
        </p>
      ) : null}

      {!atCap && displayMessages.length === 0 ? (
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
          placeholder="Ask for a nudge about the idea behind this question."
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
            variant="secondary"
            disabled={inputDisabled || draft.trim().length === 0}
          >
            <Icon icon={SendIcon} size="sm" variant="brand" />
            {isSubmitting ? "Asking…" : "Ask for help"}
          </Button>
        </div>
      </form>
    </div>
  );
}
