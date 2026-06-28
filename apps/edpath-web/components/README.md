# components/

## Purpose

All React UI for EdPath, grouped by lesson phase and cross-cutting concerns. Components render mirrored CoAgent state and send user intents — they never grade, branch, or call the LLM directly.

## Contents

| Folder | Role |
|--------|------|
| [`shell/`](./shell/) | App chrome, lesson layout, orchestrator (`LessonRunner`), CoAgent bridge hook |
| [`copilot/`](./copilot/) | CopilotKit provider and transport-error context |
| [`landing/`](./landing/) | Home-page PDF upload UI |
| [`plan/`](./plan/) | Plan approval and revision surface |
| [`mcq/`](./mcq/) | One-at-a-time quiz card and help side-channel |
| [`summary/`](./summary/) | End-of-lesson score and study tips |
| [`ui/`](./ui/) | Shared presentational primitives |

## How it fits

- **Depends on:** `@repo/types`, `@repo/schemas`, [`hooks/`](../hooks/), [`lib/`](../lib/), [`types/`](../types/).
- **Consumed by:** [`app/`](../app/) routes.
- **Orchestration:** [`shell/LessonRunner.tsx`](./shell/LessonRunner.tsx) picks which feature folder to render based on phase from [`lib/phase-ui.ts`](../lib/phase-ui.ts):
  - `awaiting_approval` → `plan/PlanWidget`
  - `awaiting_input` → `mcq/McqWidget`
  - `complete` → `summary/SummaryView`
  - generating phases → `ui/GeneratingPanel`

## Reading tips

- Start with **`shell/LessonRunner.tsx`** — it wires every feature folder together.
- The real state bridge is **`shell/useCoAgentLesson.tsx`**, not anything under `hooks/`.
- Feature folders are presentational + local UX; business rules live in the backend graph.
