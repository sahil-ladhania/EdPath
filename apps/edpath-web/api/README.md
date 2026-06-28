# api/

## Purpose

Thin HTTP clients for the two Express endpoints that run **before** the LangGraph lesson starts. After navigation to `/lesson/[threadId]`, all lesson progress flows through CopilotKit CoAgents — not these routes.

## Contents

- **`upload-api.ts`** — `uploadPdf()`: `POST /upload` on file pick. Validates the PDF and returns parsed metadata (`UploadResult`). Used for early feedback on the landing page.
- **`start-api.ts`** — `startLessonPdf()`: `POST /start` with the same file plus a fresh `threadId`. Seeds the backend checkpoint, then the client navigates to the lesson route.

Both return discriminated outcomes (`success` | `transport_error`) — they never throw on HTTP failures.

## How it fits

- **Depends on:** `@repo/schemas` (Zod validation), `@repo/types`, `NEXT_PUBLIC_EDPATH_API_URL`, axios.
- **Consumed by:** [`components/landing/UploadCard.tsx`](../components/landing/UploadCard.tsx).
- **Not used by:** `LessonRunner`, `useCoAgentLesson`, or any in-lesson surface.

## Reading tips

- "Preview upload" in comments means **server-side validation on pick** (`/upload`), not a mock lesson engine.
- The PDF is uploaded twice (pick + start) — there is no server-side upload cache between the two calls. See [`lib/lesson-handoff.ts`](../lib/lesson-handoff.ts).
