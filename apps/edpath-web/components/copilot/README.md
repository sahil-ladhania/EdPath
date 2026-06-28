# components/copilot/

## Purpose

CopilotKit runtime wiring for the lesson page — connects the Next.js client to the Express CopilotKit runtime and LangGraph agent, with user-facing handling for agent connection failures.

## Contents

- **`EdPathCopilotProvider.tsx`** — Wraps `CopilotKit` with agent id `"edpath"`, runtime URL, and thread id. Requires `NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL`.
- **`copilot-transport-error-context.tsx`** — React context for transport errors: `CopilotTransportErrorProvider`, `useCopilotTransportError`, and `handleCopilotError` wired to CopilotKit's `onError`.

## How it fits

- **Depends on:** [`lib/copilot.ts`](../../lib/copilot.ts) (`isAgentTransportFailure`), [`types/copilot.ts`](../../types/copilot.ts).
- **Consumed by:** [`app/lesson/[threadId]/page.tsx`](../../app/lesson/[threadId]/page.tsx) wraps the lesson tree; [`shell/LessonRunner.tsx`](../shell/LessonRunner.tsx) reads transport errors to suppress quiz UI and show error state.
- **Not used on:** the landing page (`/`).

## Reading tips

- Start with **`EdPathCopilotProvider.tsx`** — it is the only place `CopilotKit` is instantiated.
- Transport errors are filtered to agent/runtime failures only; unrelated CopilotKit noise is ignored.
