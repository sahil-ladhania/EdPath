# EdPath

AI learning agent that turns a PDF into an interactive, HITL-approved MCQ lesson.

**Stack:** TypeScript · LangGraph · CopilotKit · Next.js · Express · PostgreSQL · Redis

## What it does

Upload a PDF, the agent drafts a lesson plan (objectives and difficulty), you approve it, then it quizzes you objective by objective with MCQs in a custom widget. Correct answers get an explanation, wrong answers get a hint and a retry. Ends with a progress report and study tips.

## Documentation

The full design lives in [`docs/reference/`](./docs/reference/). Read the one that fits your task (see the doc map in [`AGENTS.md`](./AGENTS.md)):

- [`assignment.md`](./docs/reference/assignment.md) — the contract / acceptance criteria
- [`architecture.md`](./docs/reference/architecture.md) — system architecture, components, data flow
- [`agent-architecture.md`](./docs/reference/agent-architecture.md) — the LangGraph agent: nodes, interrupts, state, schemas
- [`design-decisions.md`](./docs/reference/design-decisions.md) — locked product/design decisions
- [`db-schema.md`](./docs/reference/db-schema.md) — persistence (checkpointer-only; why there are no app tables)
- [`feature-flow.md`](./docs/reference/feature-flow.md) — user flow, feature breakdown, AC → feature mapping
- [`challenges.md`](./docs/reference/challenges.md) — the genuinely hard parts / risk register

Working notes that fill in during the build: [`docs/handoff/`](./docs/handoff/) · [`docs/bugs/`](./docs/bugs/) · [`docs/decisions/`](./docs/decisions/) · [`docs/architecture/`](./docs/architecture/).

## Persistence

**The LangGraph checkpointer is the entire persistence layer — there are no custom tables, no ORM, and no bespoke persistence schema.** Graph state is checkpointed against a **client-held `threadId`**; that checkpointed state is the single source of truth for a lesson. Resuming a lesson means replaying from its checkpoint by `threadId` — the same mechanism the HITL gates rely on, where the graph suspends at an interrupt and resumes from the persisted checkpoint when the user acts.

**For this take-home, the checkpointer uses the in-memory backend (`MemorySaver`).** This is a deliberate scope decision, not an omission. It exercises the _complete_ graded flow within a session — upload → plan → approval gate → MCQ → submit → feedback → no-penalty retry → progression → summary, with the interrupt gates suspending and resuming correctly (covered by the test suite). Durable cross-restart persistence is **not** part of the assignment's acceptance criteria, so engineering effort went into the pedagogical workflow and the correctness of the grading/firewall/interrupt logic instead. **State is held in memory for the duration of the server process and does not survive a process restart — it is not durable storage.**

**The production path is a configuration/deployment change, not an application rewrite.** Because the checkpointer is accessed purely through LangGraph's checkpointer interface, durability is swapped at the boundary: deploy the graph behind a LangGraph server backed by Postgres, and the identical `threadId`-keyed state becomes durable across restarts. The graph nodes, interrupt gates, schemas, and CopilotKit bridge are unchanged. No custom tables or ORM are introduced in either mode — the checkpointer remains the whole persistence layer; only its backend changes.

> **Why not just set `PostgresSaver` in the graph?** The CopilotKit ↔ LangGraph JS integration runs the graph via a LangGraph server over HTTP (it cannot host a compiled graph in-process). On that path the **server** owns persistence, so a `PostgresSaver` compiled into the graph would be ignored — production durability is achieved by giving that server a Postgres backend, not by changing the application code.

## Evals

Gate 6 eval scenarios live in `apps/edpath-backend/src/evals/`. They assert end-state quality across four dimensions (plan grounding, MCQ grounding, feedback/no-leakage, loop completion) mapped to the assignment acceptance criteria.

| Tier | Command | LLM | When |
|---|---|---|---|
| **Tier 1 (CI)** | `npm test --workspace=edpath-backend -- src/evals/evals.test.ts` | No (stub plan/MCQs) | Every CI run |
| **Tier 2 (manual)** | `EVAL_LLM=1 npm run eval --workspace=edpath-backend` | Yes | Pre-demo / pre-release |
| **LangSmith sync** | `npm run eval:sync-dataset --workspace=edpath-backend` | — | Optional dataset upload |

**Pass criteria:** all asserted dimensions green per case; Tier 1 stub cases must pass in CI; Tier 2 target ≥ 95% suite pass with LLM judges enabled (`EVAL_LLM=1` + `OPENAI_API_KEY`). Filter subsets with `EVAL_FILTER=HP-*` or `ADV-*`.

## Status

Work in progress.