# EdPath Backend (`src/`)

Express host for PDF intake, lesson thread seeding, and the CopilotKit runtime that bridges the frontend to the LangGraph teaching workflow.

## Folder map

| Folder | Role |
|--------|------|
| `agent/` | Deterministic LangGraph workflow (Plan → Approve → Quiz → Summarize). See `agent/README.md`. |
| `config/` | Zod-validated environment (`env.ts`); fail-fast on boot. |
| `copilot/` | CopilotKit ↔ LangGraph bridge (runtime registration + checkpoint/resume overrides). |
| `evals/` | Offline quality/safety harness over scripted scenarios. |
| `features/` | HTTP feature slices (`upload/`, `start/`) — route / service / middleware split. |
| `lib/` | Cross-feature infrastructure (not agent-specific). See `lib/README.md`. |

## Entry points

- `index.ts` — boot: validate env, create Express app, listen.
- `app.ts` — Express wiring: `/health`, `/upload`, `/start`, CopilotKit handler.
- `agent/graph.ts` — compiles the teaching workflow (`createEdPathGraph` / `graph`).

## Two invariants every reader should know

1. **Checkpointer-only persistence** — Postgres LangGraph checkpointer is the entire persistence layer; checkpointed graph state is the source of truth. No app tables.
2. **Redacted CoAgent mirror** — only `coAgentSnapshot` (firewalled `PublicMCQ` mirror) crosses to the browser. Full state (`pdfText`, `MCQ[]` with answers, routing) stays internal.
