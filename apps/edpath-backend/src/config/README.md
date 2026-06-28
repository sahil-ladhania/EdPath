# Config (`config/`)

Single file: `env.ts`.

- Zod-validated environment — **fail-fast on boot** if required vars are invalid.
- `isOpenAiConfigured()` — gates real LLM paths vs stub tiers in tests/evals.
- `isLangSmithTracingEnabled()` — optional LangSmith tracing when API key is present.

Stub paths exist so unit tests and Tier-1 evals run without live OpenAI calls.
