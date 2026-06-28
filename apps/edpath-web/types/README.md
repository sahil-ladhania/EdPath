# types/

## Purpose

App-local TypeScript contracts — prop interfaces, hook option/return shapes, and discriminated unions for this frontend. Shared domain types and Zod schemas live in `@repo/types` and `@repo/schemas`; this folder holds what is specific to the web app's components and hooks.

## Contents

- **`lesson.ts`** — `UseCoAgentLessonReturn`, interrupt bridge props, approval/await-input interrupt value shapes.
- **`mcq.ts`** — `UseCoAgentQuizOptions`/`Return`, `McqWidgetProps`, and related MCQ UI contracts.
- **`plan.ts`** — `UsePlanRevisionOptions`/`Return`, `PlanWidgetProps`, `PlanReviseChatProps`, chat message shape.
- **`shell.ts`** — `ObjectiveRailProps`, `LessonErrorBannerProps`.
- **`api.ts`** — `UploadApiOutcome`, `StartApiOutcome` discriminated unions for REST clients.
- **`copilot.ts`** — `CopilotTransportError`, `CopilotTransportErrorContextValue`.
- **`landing.ts`** — `UploadBannerState` union for upload status banner.

## How it fits

- **Depends on:** `@repo/types`, `@repo/schemas` (for shared types referenced in interfaces).
- **Consumed by:** matching feature folders — `lesson.ts` → shell, `mcq.ts` → mcq + hooks, `plan.ts` → plan + hooks, etc.
- **Not duplicated here:** `CoAgentState`, `LessonPlan`, `PublicMCQ`, `Summary`, Zod validators — import those from `@repo/types` / `@repo/schemas`.

## Reading tips

- Pair each file with its consumer folder — e.g. read `mcq.ts` alongside [`hooks/useCoAgentQuiz.tsx`](../hooks/useCoAgentQuiz.tsx) and [`components/mcq/McqWidget.tsx`](../components/mcq/McqWidget.tsx).
- If a type describes backend graph state, it probably belongs in `packages/` — not here.
