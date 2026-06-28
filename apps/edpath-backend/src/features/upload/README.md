# Upload (`features/upload/`)

PDF ingest pipeline upstream of the graph — the graph only ever starts on validated text.

## Flow

```
POST /upload
  → upload-middleware.ts (multer)
  → upload.route.ts (handler)
  → upload.service.ts (validation gauntlet)
      → pdf-extract.ts (pdf.js)
      → pdf-clean.ts (normalize + token estimate)
  → typed UploadResult (accepted or rejected)
```

## Key files

| File | Role |
|------|------|
| `upload.service.ts` | Linear gauntlet: size → magic bytes → extract → page/char/token ceilings → min-text. |
| `pdf-extract.ts` | pdf.js text extraction; maps errors to typed kinds. |
| `pdf-clean.ts` | Whitespace normalization, token estimation. |
| `build-initial-state.ts` | Builds graph seed from accepted upload — consumed by `/start`. |
| `upload.types.ts` | Pipeline DTOs including `InitialEdPathStateSeed`. |
| `test-fixtures.ts` | Inline PDF byte fixtures for tests. |

## Boundaries

- **`pdfText` never crosses the HTTP boundary** — only `pdfMeta` (filename, page count, char/token counts) is returned to the client.
- `UploadFileInput.mimetype` is populated at the route layer but **not read** in `upload.service.ts`; type detection uses magic bytes instead.
