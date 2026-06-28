# components/mcq/

## Purpose

One-question-at-a-time quiz UI — renders the current `PublicMCQ`, green/red functional feedback, retry actions, and the bounded "help me" side-channel. Grading and answer keys stay on the server; this folder only displays mirrored state and sends user intents.

## Contents

- **`McqWidget.tsx`** — Composes the full quiz card: question header, options, feedback banner, help panel, and action buttons.
- **`QuestionHeader.tsx`** — Objective title, question number, and attempt counter.
- **`OptionList.tsx`** — Radio options with functional green/red/disabled states from feedback and tried indices.
- **`FeedbackBanner.tsx`** — Shows verdict copy after grading (correct / incorrect).
- **`WidgetActions.tsx`** — Submit, retry, or advance CTA depending on feedback state.
- **`HelpInput.tsx`** — Assist side-channel: thread bubbles, turn cap, suggested prompts, typewriter on assistant replies.
- **`quiz-firewall.contract-test.tsx`** — Dev contract check that assist UI props never include `correctIndex`, `explanation`, `hint`, or `sourceQuote`.

## How it fits

- **Depends on:** [`hooks/useCoAgentQuiz.tsx`](../../hooks/useCoAgentQuiz.tsx) (via `LessonRunner` props), [`hooks/useTypewriter.ts`](../../hooks/useTypewriter.ts) (HelpInput), [`components/ui/`](../ui/), [`types/mcq.ts`](../../types/mcq.ts), `@repo/schemas/constants` (`MAX_ATTEMPTS`, `MAX_HELP`).
- **Consumed by:** [`shell/LessonRunner.tsx`](../shell/LessonRunner.tsx) when phase is `awaiting_input` and a current question exists.
- **Intents flow:** widget callbacks → `useCoAgentQuiz` → `useCoAgentLesson` → LangGraph interrupt resolution.

## Reading tips

- Start with **`McqWidget.tsx`**, then **`HelpInput.tsx`** for the assist firewall pattern.
- `PublicMCQ` from `@repo/types` intentionally omits the answer key — the UI never receives `correctIndex`.
