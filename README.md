# EdPath

AI learning agent that turns a PDF into an interactive, HITL-approved MCQ lesson.

![EdPath home screen](docs/assets/edpath-home.png)

## What it does

Upload a PDF, the agent drafts a lesson plan (objectives and difficulty), you approve it, then it quizzes you objective by objective with MCQs in a custom widget. Correct answers get an explanation, wrong answers get a hint and a retry. Ends with a progress report and study tips.

## Tech stack

What runs in this assignment, and why each piece is here:

| Area | Technology | Why it's used |
|---|---|---|
| Language | **TypeScript (strict)** | One type-safe codebase across web + backend; shared contracts via `packages/`. |
| Agent runtime | **LangGraph (JS)** | The deterministic teaching workflow — nodes, conditional edges, two `interrupt` gates, and the checkpointer. Engineering owns control flow; the LLM only fills content. |
| Agent ↔ UI bridge | **CopilotKit CoAgents** | Mirrors LangGraph state into React, renders the generative MCQ/plan UI, and surfaces the `interrupt`/resume for HITL. |
| Graph host | **LangGraph dev server** (`@langchain/langgraph-cli`) | Runs the compiled graph over HTTP on `:2024`; the CopilotKit Runtime drives it (it can't host a compiled graph in-process). |
| Web | **Next.js (App Router)** | Upload screen, plan approval, one-at-a-time MCQ widget, "help me" side-channel, summary. |
| Backend | **Express** | Hosts `/upload`, `/start`, and the **CopilotKit Runtime** endpoint; Zod-validates every artifact at the boundary. |
| LLM | **OpenAI `gpt-4o-mini`** (`gpt-4o` plan escape) | Generative nodes only: plan, MCQ, assist, summary. Grounded in `pdfText`, never general knowledge. |
| Contracts | **Zod** (`packages/schemas`) | Single source of truth for `LessonPlan` / `MCQ` / `Feedback` / `Summary`; validated before anything reaches state or the widget. |
| Persistence | **LangGraph checkpointer** (`MemorySaver`) | Checkpointed graph state keyed by `threadId` is the single source of truth; powers HITL pause + refresh-resume. In-memory here; Postgres in production (see [Persistence](#persistence)). |
| PDF ingestion | **pdfjs-dist** | Extracts and cleans the PDF text layer; rejects empty/scanned/oversized PDFs before the graph starts. |
| Observability | **LangSmith** | Optional tracing of every graph run (omit the env vars to disable). |
| Styling / UI | **Tailwind CSS v4** + shared `packages/ui` & `packages/tokens` | Design system, components, and design tokens shared across the app. |
| Monorepo | **Turborepo + npm workspaces** | `apps/*` + shared `packages/*` (`schemas`, `types`, `ui`, `tokens`, configs). |
| Testing & evals | **Vitest** | Unit + integration tests and the Gate 6 eval suite (see [Evals](#evals)). |

## Architecture

Three views — the product flow, the running system, and the agent graph. (Diagrams render natively on GitHub.)

### 1. Product flow

The fixed pedagogical arc the learner moves through: **Plan → Approve (HITL) → Quiz loop → Summarize.**

```mermaid
flowchart TD
    U([User]) -->|uploads PDF| UP[Parse and clean PDF text]
    UP --> PLAN[Draft lesson plan<br/>objectives + difficulty]
    PLAN --> APPROVE{Approve plan?}
    APPROVE -->|request changes| PLAN
    APPROVE -->|approve| GEN[Generate 3 grounded MCQs<br/>for current objective]
    GEN --> Q[Show one MCQ<br/>radios + submit]
    Q -->|need a nudge| HELP[Bounded help turn<br/>concept only, never the answer]
    HELP --> Q
    Q -->|submit answer| GRADE{Correct?}
    GRADE -->|incorrect, retries left| HINT[Red + hint<br/>retry, no penalty]
    HINT --> Q
    GRADE -->|correct or out of tries| FB[Green + explanation]
    FB -->|Next question| NEXT{More questions<br/>or objectives?}
    NEXT -->|yes| GEN
    NEXT -->|no| SUM[Summary report<br/>score + study tips]
    SUM --> DONE([Lesson complete])
```

### 2. System architecture (as it runs today)

How the processes and services fit together at runtime. Lesson logic lives entirely in the graph; the web app only mirrors state.

```mermaid
flowchart LR
    subgraph Browser["Browser — apps/edpath-web · Next.js :3000"]
        UPUI[Upload UI]
        CK[CopilotKit provider<br/>useCoAgent state mirror]
        WID[MCQ widget · plan approval · summary]
    end

    subgraph BE["apps/edpath-backend · Express :4000"]
        UPL["/upload — pdfjs extract + clean"]
        STR["/start — seed thread state"]
        RT[CopilotKit Runtime<br/>EdPath ↔ LangGraph bridge]
    end

    subgraph LG["LangGraph dev server :2024"]
        GRAPH[edpath-agent graph<br/>N1–N9 · 2 interrupts]
        CP[(MemorySaver checkpointer<br/>in-memory · per threadId)]
    end

    OPENAI[(OpenAI API<br/>gpt-4o-mini)]
    LS[(LangSmith<br/>tracing · optional)]
    SCH[[packages/schemas<br/>Zod contracts]]

    UPUI -->|multipart PDF| UPL
    UPL -->|cleaned pdfText| STR
    STR -->|seed pdfText + threadId| GRAPH
    CK <-->|state + interrupt/resume| RT
    RT <-->|run / resume over HTTP| GRAPH
    GRAPH <--> CP
    GRAPH -->|generative nodes| OPENAI
    GRAPH -.->|traces| LS
    UPL -. validates .-> SCH
    GRAPH -. validates .-> SCH
```

### 3. Agent architecture (the LangGraph graph)

The deterministic graph. Every branch is a code-level decision over state — the LLM never picks the next step. `⏸` marks a checkpointer-backed `interrupt` (survives refresh).

```mermaid
flowchart TD
    START([START]) --> PLAN[N1 plan]
    PLAN --> AG{{N2 approval_gate ⏸}}
    AG -->|changes| PLAN
    AG -->|approve| GEN[N3 generate_mcq]
    GEN -->|repair retry, bounded| GEN
    GEN -->|questions ready| AI{{N4 await_input ⏸}}
    GEN -->|generation failed, budget spent| AI
    AI -->|help| ASSIST[N5 assist<br/>no correctIndex]
    ASSIST --> AI
    AI -->|answer| GRADE[N6 grade<br/>deterministic]
    AI -->|Try again| GEN
    AI -->|Next question| ADV[N8 advance]
    GRADE -->|grading error| AI
    GRADE --> FB[N7 feedback]
    FB --> AI
    ADV -->|more questions| AI
    ADV -->|next objective| GEN
    ADV -->|all objectives done| SUM[N9 summarize]
    SUM --> ENDN([END])
```

- **Incorrect answer** stays at `await_input` (red + hint) → the user retries with a fresh `answer` (no penalty).
- **Correct / out-of-tries** holds the feedback at `await_input`; the user clicks **Next question** → `advance`.
- **Help** is the one bounded dynamic pocket: a single guarded call that can only return to `await_input` (max 3 per question), and never sees `correctIndex`.
- **Generation failure** pauses at `await_input` with a **Try again** affordance instead of dead-ending.

## Prerequisites

- **Node.js 18+** (20+ recommended) and **npm 10+**.
- **An OpenAI API key** — required for real PDF-grounded plans, MCQs, hints, and summaries. Without it the backend falls back to non-grounded stub content (useful for a dry run, but not a real lesson).
- **No database to install.** The LangGraph checkpointer runs in memory — Postgres and Redis are **not** required to run EdPath locally (see [Persistence](#persistence)).

## Setup

```bash
npm install

# Backend env — then add your OPENAI_API_KEY
cp apps/edpath-backend/.env.example apps/edpath-backend/.env

# Web env (defaults already point at the local backend)
cp apps/edpath-web/.env.example apps/edpath-web/.env.local
```

## Run locally

EdPath runs as **three processes**. Start them in this order, each in its own terminal from the repo root:

```bash
# 1. LangGraph dev server — hosts the graph "edpath-agent" on :2024
npm run langgraph:dev

# 2. Express backend + CopilotKit runtime — on :4000 (bridges to the graph)
npm run dev --workspace=edpath-backend

# 3. Next.js web app — on :3000 (talks to the backend)
npm run dev --workspace=edpath-web
```

Then open **http://localhost:3000**.

> Order matters: the backend bridges to the LangGraph server, and the web app talks to the backend. The CopilotKit runtime runs the graph via the LangGraph server over HTTP (it can't host a compiled graph in-process) — which is why the LangGraph dev server is a separate process.

### Environment variables

**Backend** (`apps/edpath-backend/.env`):

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | **Yes** (for real grounding) | LLM calls for plan/MCQ/hint/summary nodes. Omit → non-grounded stub content. |
| `EDPATH_LANGGRAPH_DEPLOYMENT_URL` | No (default `http://localhost:2024`) | URL of the LangGraph dev server. |
| `EDPATH_LANGGRAPH_GRAPH_ID` | No (default `edpath-agent`) | Graph id from `langgraph.json`. |
| `LANGSMITH_*` | No | Optional tracing — omit entirely to disable. |

**Web** (`apps/edpath-web/.env.local`):

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_EDPATH_API_URL` | Yes (default `http://localhost:4000`) | Express backend base URL. |
| `NEXT_PUBLIC_EDPATH_COPILOT_RUNTIME_URL` | Yes (default `http://localhost:4000/copilotkit`) | CopilotKit runtime endpoint. |

### Smoke test

1. Open http://localhost:3000 and **upload a small text-layer PDF**.
2. Wait for the **plan**, then **Approve** (or request changes to re-plan).
3. The first objective's **MCQs** generate; answer one **wrong** → red highlight, hint, no-penalty **Retry**.
4. Answer **correctly** → green highlight, explanation, **Next question**.
5. Work through the objectives → **summary** with score + study tips.
6. **Refresh mid-quiz** → the lesson resumes on the same question (checkpointed state).

Run the test suite anytime with `npm test` (or `npm test --workspace=edpath-backend`).

## Three key design decisions that I took

### 1. RAG vs. no RAG

**I chose no RAG.** EdPath v1 works with one bounded PDF, so the complete cleaned text can be passed directly to the model. A vector database and retrieval pipeline would add chunking, retrieval misses, and operational complexity without solving a current requirement. The trade-off is that this approach will not scale to large document collections.

### 2. Deterministic workflow vs. autonomous agent

**I chose a deterministic LangGraph workflow.** The lesson has a fixed teaching sequence, approval gate, retry rules, and deterministic grading. Keeping control flow in code makes the experience predictable and testable; the LLM generates grounded content but never decides what step runs next.

### 3. Persistence: `MemorySaver` vs. Postgres

**I chose the LangGraph checkpointer as the entire persistence layer, using `MemorySaver` for this take-home.** It supports `threadId`-based checkpoints, interrupts, and browser-refresh recovery without custom tables or an ORM. The trade-off is that state does not survive a graph-server restart. For production durability, the same checkpointer boundary can use a Postgres-backed LangGraph server.
