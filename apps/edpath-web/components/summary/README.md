# components/summary/

## Purpose

End-of-lesson surface shown when the graph reaches `phase: "complete"` — overall score, per-objective breakdown, study tips, and a link back to upload a new PDF.

## Contents

- **`SummaryView.tsx`** — Composes all summary sections inside a `Panel`.
- **`OverallScore.tsx`** — Headline score (correct / total, first-try count).
- **`PerObjectiveTable.tsx`** — Per-objective results table from mirrored `summary` state.
- **`StudyTipsList.tsx`** — Generated study tips list.
- **`RestartCta.tsx`** — Navigation back to the landing page for a new lesson.

## How it fits

- **Depends on:** [`components/ui/`](../ui/), `@repo/types` (`Summary`).
- **Consumed by:** [`shell/LessonRunner.tsx`](../shell/LessonRunner.tsx) when phase is `complete`.
- **Data source:** `coAgentLesson.state.summary` — generated entirely by the backend `summarize` node.

## Reading tips

- Start with **`SummaryView.tsx`** — it is a thin composition layer with no local state.
- While the summary is generating, the UI shows a loader (handled in `LessonRunner` via `lib/phase-ui.ts`), not this folder.
