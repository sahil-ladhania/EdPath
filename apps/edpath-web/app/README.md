# app/

## Purpose

Next.js App Router entry for EdPath — root layout, global styles, and the two user-facing routes (landing upload and the live lesson page).

## Contents

- **`layout.tsx`** — Root layout: fonts (Inter, Bricolage Grotesque, Geist Mono), metadata, and `globals.css`.
- **`page.tsx`** — Home route (`/`): landing hero + upload card inside `AppShell`. No CopilotKit here.
- **`lesson/[threadId]/page.tsx`** — Lesson route: wraps content in `EdPathCopilotProvider` and mounts `LessonRunner` for the checkpointed thread.
- **`globals.css`** — Tailwind base directives and EdPath design tokens.
- **`icon.svg`** — App favicon asset.

## How it fits

- **Depends on:** [`components/`](../components/) (shell, landing, copilot), env vars for API and Copilot runtime URLs on the lesson route.
- **Consumed by:** Next.js routing only — no other app code imports from `app/`.
- Landing uses [`api/`](../api/) indirectly via `UploadCard`; the lesson route is where CoAgent state begins flowing.

## Reading tips

- Start with **`lesson/[threadId]/page.tsx`** to see where CopilotKit is scoped to a thread.
- Only the lesson route mounts `EdPathCopilotProvider` — the home page is a plain React tree with REST upload calls.
