# Start (`features/start/`)

Upload + seed a LangGraph thread in one call.

## Flow

```
POST /start (threadId + PDF)
  → start-middleware (reuses upload multer)
  → start.service.ts
      → processUpload (upload gauntlet)
      → buildInitialEdPathState
      → seedLessonThread (LangGraph deployment client)
```

## Behavior

- **threadId** — must be a valid UUID v4; validated in `start.service.ts`.
- **Idempotency** — returns 409 if the thread already has seeded `pdfText` (`ThreadAlreadyStartedError`).
- **HTTP error mapping** — upload rejections → 422; invalid threadId → 400; deployment errors → 502.

Reuses `features/upload/` middleware and `upload.service.ts` for the PDF pipeline.
