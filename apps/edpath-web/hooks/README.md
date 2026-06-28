# hooks/

## Purpose

Client-side UX hooks that layer local interaction state on top of mirrored CoAgent state. They send intents via callbacks — they do not grade, branch, or own lesson progress.

## Contents

- **`useCoAgentQuiz.tsx`** — Quiz interaction UX: local option selection, tried indices, retry unlock, help-submit pending state. Resets on question/objective change. Calls `submitAnswer`, `submitHelp`, and `advance` from `useCoAgentLesson`.
- **`usePlanRevision.tsx`** — Replan submit/idle detection: tracks in-flight revision via plan fingerprint change and `isRunning` (agent is idle at the approval interrupt, so completion requires fingerprint change or a run that started and finished).
- **`useTypewriter.ts`** — Generic character-by-character text reveal; used by MCQ help assistant reply bubbles.

## How it fits

- **Depends on:** `@repo/types`, `@repo/schemas`, [`lib/plan.ts`](../lib/plan.ts) (fingerprint), [`types/mcq.ts`](../types/mcq.ts), [`types/plan.ts`](../types/plan.ts).
- **Consumed by:** [`components/shell/LessonRunner.tsx`](../components/shell/LessonRunner.tsx) (quiz + plan revision), [`components/mcq/HelpInput.tsx`](../components/mcq/HelpInput.tsx) (typewriter).
- **Not here:** `useCoAgentLesson` — that is the CoAgent bridge and lives in [`components/shell/`](../components/shell/).

## Reading tips

- Start with **`useCoAgentQuiz.tsx`** — it is the largest hook and shows the intent-only pattern clearly.
- All durable state (score, feedback, help thread, phase) comes from mirrored agent state, not these hooks.
