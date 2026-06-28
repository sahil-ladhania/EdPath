# Agent lib (`agent/lib/`)

Standalone, mostly-pure helpers used by graph nodes. **Not** the same as `src/lib/` (app-wide infra) — see `src/lib/README.md`.

| File | Role |
|------|------|
| `source-anchor.ts` | Verifies `sourceQuote` is grounded in `pdfText` (token-exact window match). |
| `structured-generate.ts` | LLM call + Zod validation + bounded repair loop (B5). |
| `llm/client.ts` | **Only IO boundary** in this folder — OpenAI client singleton + model selection. |
| `assist-input.ts` | Builds firewalled assist prompt input; paired with `assertAssistFirewall`. |
| `parse-mcq-batch.ts` | Normalizes and validates an LLM MCQ batch before state merge. |
| `grade-answer.ts` | Pure deterministic grader (N6) — compares `selectedIndex` to `correctIndex`. |
