# lib/

## Purpose

Pure helpers and small utilities with no React dependencies (except where noted). Phase resolution, interrupt parsing, thread handoff, and Tailwind class merging — no UI, no API calls.

## Contents

- **`phase-ui.ts`** — Maps mirrored graph state to UI phase, loader copy, error titles, and surface visibility. Includes the summarizing-transition heuristic (graph stays `phase: "quizzing"` while summary generates).
- **`lesson.ts`** — LangGraph interrupt helpers: parse and classify approval vs await-input payloads.
- **`lesson-handoff.ts`** — Client thread helpers: `createThreadId()`, `rememberThreadId()` (localStorage resume hint).
- **`lesson-in-progress.ts`** — `isLessonAlreadyInProgress()` — guards agent auto-start on resumed checkpoints.
- **`empty-co-agent-state.ts`** — `getEmptyCoAgentState()` — frontend seed matching backend `build-initial-state` (empty plan, no questions).
- **`plan.ts`** — `getPlanFingerprint()` — cheap before/after comparison for replan completion.
- **`copilot.ts`** — `isAgentTransportFailure()` — filters CopilotKit errors to agent/runtime connection failures.
- **`utils.ts`** — `cn()` — Tailwind class merge (`clsx` + `tailwind-merge`).

## How it fits

- **Depends on:** `@repo/types`, [`types/lesson.ts`](../types/lesson.ts) (interrupt value shapes).
- **Consumed by:** [`components/shell/`](../components/shell/) (phase-ui, lesson, empty state, in-progress guard), [`components/copilot/`](../components/copilot/) (copilot.ts), [`components/landing/`](../components/landing/) (lesson-handoff), [`hooks/usePlanRevision.tsx`](../hooks/usePlanRevision.tsx) (plan.ts), all UI components (`utils.ts`).

## Reading tips

- Start with **`phase-ui.ts`** if you need to understand why a loader vs quiz vs summary shows — it is the single source for phase-driven visibility.
- The summarizing transition is non-obvious: read the block comment at the top of `phase-ui.ts` before changing loader behavior.
