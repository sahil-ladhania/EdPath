# components/shell/

## Purpose

App chrome, lesson page layout, and the central orchestration layer for the live lesson. This folder owns `useCoAgentLesson` — the CopilotKit bridge that mirrors LangGraph state and resolves HITL interrupts.

## Contents

- **`useCoAgentLesson.tsx`** — CoAgent bridge: `useCoAgent`, `useLangGraphInterrupt`, normalized state, and intent callbacks (`approvePlan`, `submitAnswer`, `submitHelp`, `advance`, `requestPlanRevision`). Auto-starts the agent on fresh threads.
- **`LessonRunner.tsx`** — Orchestrator: wires `useCoAgentLesson`, `useCoAgentQuiz`, and `usePlanRevision`; resolves phase; switches plan / quiz / summary / loader surfaces.
- **`LessonShell.tsx`** — Two-column layout: objective rail (aside) + main content.
- **`AppShell.tsx`** — Site header with logo, used on landing and lesson pages.
- **`ObjectiveRail.tsx`** — Sidebar objective list with plan-review and in-quiz progress highlighting.
- **`LessonErrorBanner.tsx`** — Displays graph generation errors with optional retry.
- **`coagent-lesson.contract-test.tsx`** — Dev contract harness for the CoAgent bridge (not mounted in routes).

## How it fits

- **Depends on:** [`components/copilot/`](../copilot/) (transport errors), feature folders (`plan/`, `mcq/`, `summary/`), [`hooks/`](../hooks/) (`useCoAgentQuiz`, `usePlanRevision`), [`lib/`](../lib/) (`phase-ui`, `lesson`, `empty-co-agent-state`, `lesson-in-progress`), [`types/lesson.ts`](../types/lesson.ts).
- **Consumed by:** [`app/lesson/[threadId]/page.tsx`](../../app/lesson/[threadId]/page.tsx), [`app/page.tsx`](../../app/page.tsx) (AppShell only).

## Reading tips

- Start with **`LessonRunner.tsx`**, then read **`useCoAgentLesson.tsx`** for interrupt resolution.
- `useCoAgentLesson` lives here intentionally — it is tightly coupled to LangGraph interrupt bridges, not generic hook logic.
- `useLangGraphInterrupt` must stay as a single hook instance; duplicate instances fight over CopilotKit's interrupt element (see comment in `useCoAgentLesson.tsx`).
