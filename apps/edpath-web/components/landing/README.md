# components/landing/

## Purpose

Home-page UI for the PDF upload entry point — hero copy, file picker, validation feedback, and the "Start lesson" action that seeds a thread and navigates to the lesson route.

## Contents

- **`UploadCard.tsx`** — Main upload flow: validate on file pick (`POST /upload`), start on button click (`POST /start` + navigate to `/lesson/[threadId]`).
- **`LandingHero.tsx`** — Marketing headline and value proposition for the left column.
- **`UploadGuidelines.tsx`** — File requirements and tips shown inside the upload card.
- **`UploadStateBanner.tsx`** — Inline status banner (idle, loading, success, error) driven by upload/start outcomes.

## How it fits

- **Depends on:** [`api/upload-api.ts`](../../api/upload-api.ts), [`api/start-api.ts`](../../api/start-api.ts), [`lib/lesson-handoff.ts`](../../lib/lesson-handoff.ts) (thread id creation), [`components/ui/`](../ui/), [`types/landing.ts`](../../types/landing.ts).
- **Consumed by:** [`app/page.tsx`](../../app/page.tsx).
- **Does not use:** CopilotKit or any CoAgent hooks — lesson state begins only after navigation.

## Reading tips

- Start with **`UploadCard.tsx`** — it owns the full two-step upload → start → navigate sequence.
- The PDF is uploaded twice (validation pass, then start pass); there is no client-side lesson simulation.
