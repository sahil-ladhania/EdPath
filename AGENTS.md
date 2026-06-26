# AGENTS.md

Canonical, always-on rules for AI agents in this repo (Claude Code and Cursor both read this). **Thin by design: it routes to the deep docs, it does not duplicate them.** Read it every session; pull in the ONE deep doc the task needs — never all of them.

## What EdPath is

EdPath turns one uploaded PDF into a guided, interactive lesson: **Plan → Approve (HITL) → Quiz loop → Summarize**. The quiz loop runs MCQs one card at a time with green/red feedback, conceptual hints, no-penalty retries, and a bounded "help me" side-channel. It is a **deterministic LangGraph teaching workflow powered by an LLM** — engineering owns the control flow; the LLM only fills content at the generative nodes.

## Non-negotiables (do not violate)

- **Workflow, not an autonomous agent.** The LLM never chooses the next step. Control flow, branching, and grading are deterministic code.
- **LangGraph + CopilotKit CoAgents** are the agent and the UI bridge. Don't swap them out.
- **No RAG, no vector DB, no Neo4j, no knowledge graph.** The whole cleaned `pdfText` rides in the prompt as the grounding source.
- **PDF-grounded content.** Plans, MCQs, hints, explanations, and summaries derive from `pdfText`, never from general model knowledge.
- **No bespoke tables, no Prisma, no custom ORM/persistence schema.** The Postgres **LangGraph checkpointer is the entire persistence layer**; checkpointed graph state is the single source of truth.
- **TypeScript strict everywhere.**
- **Shared contracts live in `packages/schemas`** (Zod validators + types, one source for both ends). Every artifact is Zod-validated at the backend boundary before it reaches state or the widget.
- **Deterministic grading** (code, never the LLM) and a structural **assist firewall**: the help side-channel never receives `correctIndex` (nor `explanation` / `hint` / `sourceQuote`).
- **Green/red is functional feedback, not styling.**

## Stack

TypeScript (strict) · LangGraph · CopilotKit CoAgents · Next.js (`apps/edpath-web`) · Express (`apps/edpath-backend`, hosts the CopilotKit Runtime) · PostgreSQL (LangGraph checkpointer backend) · LangSmith (tracing) · monorepo with shared `packages/` (`schemas`, `ui`, `tokens`, configs). Redis is deferred — not in v1.

## Doc map — read the ONE that fits the task

The seven locked reference docs live in `docs/reference/`. Read the ONE that fits the task.

| Working on… | Read |
|---|---|
| The contract / acceptance criteria (what's required) | `docs/reference/assignment.md` |
| System architecture, components, data flow, boundaries, storage | `docs/reference/architecture.md` |
| Agent/graph design: nodes, edges, interrupts, state object, schemas/ACI, reliability | `docs/reference/agent-architecture.md` |
| Any product-behavior / "what should it do" question (locked decisions) | `docs/reference/design-decisions.md` |
| Persistence, storage, what is/isn't a table, future-table triggers | `docs/reference/db-schema.md` |
| Feature & flow detail, user flow, acceptance-criteria → feature mapping | `docs/reference/feature-flow.md` |
| Known risks / the genuinely hard parts | `docs/reference/challenges.md` |

Living/working notes (filled during the build, not part of the locked reference set): `docs/handoff/` (session resume state) · `docs/bugs/` (issues found) · `docs/decisions/` (new ADRs) · `docs/architecture/` (code-level maps).

**Read only the doc(s) the current task needs — do not load all of them.**
