# components/plan/

## Purpose

Plan approval surface shown at the HITL interrupt — lists generated objectives, lets the user approve or request a revision, and shows a replan chat overlay while the graph regenerates the plan.

## Contents

- **`PlanWidget.tsx`** — Top-level plan card: composes header, objective list, actions, and revision overlay.
- **`PlanHeader.tsx`** — PDF title, objective count, and phase-aware eyebrow copy.
- **`PlanObjectiveItem.tsx`** — Single objective row (title, difficulty badge).
- **`PlanActions.tsx`** — Approve and "Revise plan" buttons.
- **`PlanReviseChat.tsx`** — Inline chat UI for revision notes; submits via `requestPlanRevision` from the CoAgent bridge.

## How it fits

- **Depends on:** [`components/ui/`](../ui/), [`types/plan.ts`](../../types/plan.ts), `@repo/types` (`LessonPlan`, `Phase`).
- **Consumed by:** [`shell/LessonRunner.tsx`](../shell/LessonRunner.tsx) when phase is `awaiting_approval`.
- **Wired through:** `useCoAgentLesson` (approve/revise intents) and [`hooks/usePlanRevision.tsx`](../../hooks/usePlanRevision.tsx) (replan-in-flight UX).

## Reading tips

- Start with **`PlanWidget.tsx`** — props are passed straight from `LessonRunner`.
- Approve calls `approvePlan()` which resolves the LangGraph approval interrupt — the graph owns what happens next.
