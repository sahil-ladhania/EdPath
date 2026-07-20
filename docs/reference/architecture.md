# EdPath — System Architecture

> Companion document: `[agent-architecture.md](./agent-architecture.md)` (the agent design / gate walk).
> Source of truth: `[assignment.md](./assignment.md)` · risk register: `[challenges.md](./challenges.md)`.
>
> `PROVISIONAL:` tags marked simplest-default positions pending the decisions session. That session is complete: the locked outcomes live in `design-decisions.md` and have been reconciled into this document (see §9). A remaining `PROVISIONAL` tag marks a still-open *optional* item, not an unmade decision.

## Table of Contents

- [1. What EdPath is](#1-what-edpath-is)
- [2. The contract (Gate 0)](#2-the-contract-gate-0)
  - [System input](#system-input)
  - [System output](#system-output)
  - [Success criteria](#success-criteria-traced-to-acceptance-criteria)
- [3. Workflow, not agent (Gate 1)](#3-workflow-not-agent-gate-1)
  - [End-to-end control flow](#end-to-end-control-flow)
  - [The one dynamic part, kept bounded](#the-one-dynamic-part-kept-bounded)
- [4. System components & data flow](#4-system-components--data-flow)
- [5. The CopilotKit bridge](#5-the-copilotkit-bridge--verify-against-current-copilotkit-docs)
- [6. Storage — pressure-tested](#6-storage--pressure-tested)
- [7. Responsibility boundaries](#7-responsibility-boundaries)
- [8. Stack (locked)](#8-stack-locked)
- [9. Resolved in](#9-resolved-in-design-decisionsmd) `design-decisions.md`

---



## 1. What EdPath is

EdPath turns **one uploaded PDF into a guided, interactive lesson**.

It walks a learner through a fixed pedagogical arc:

- parse the PDF →
- draft a learning plan →
- get human approval →
- run a quiz loop (MCQs with green/red feedback, hints, no-penalty retries, and a bounded "help me" side-channel) →
- produce a final report with study tips

It is a **deterministic teaching system powered by an LLM**: a structured LangGraph **workflow**, not an open-ended autonomous agent. Engineering owns the control flow; the LLM fills content at each step.

### Scope fence

- **In:** exactly what `assignment.md` requires — the nine acceptance criteria.
- **Out / deferred to** `design-decisions.md`**:** PDF input limits, hint reveal level, quiz batch-vs-single, feedback detail, state-storage specifics, knowledge representation, completion criteria, user freedom, etc. Where this document needs a position on one, it adopts the simplest default and tags it `PROVISIONAL`.
- **Non-goals:** no multi-PDF, no RAG / vector DB, no multi-user/auth, no bespoke persistence schema (checkpointer first).

---



## 2. The contract (Gate 0)



### System input

**Primary**

- one **PDF file**, uploaded by a single user
- **Ingestion ceiling (locked — D3 / B6):** about 50 pages, 50K tokens, or 200K cleaned characters — token/character count is the real gate, page count a soft signal
- Reject empty, scanned/image-only (no text layer), oversized, or otherwise unparseable PDFs at upload with a clear error
- **no OCR in v1.**
- The cleaned text rides in context (no RAG)

**Runtime inputs (arrive during the run)**

- the plan **approval decision**
- an **MCQ answer** (selected option) per question
- optional **free-text help turns** ("hint" / "explain this topic")

---



### System output

A **completed, resumable lesson session**, surfaced as four observable artifacts in sequence:

1. A **lesson plan** (objectives + difficulty) shown for approval.
2. A stream of **MCQ widgets** (question, radio options, submit), one objective at a time.
3. **Per-answer feedback** — green + explanation (correct) or red + hint + retry (incorrect); plus answers to help turns that never reveal the correct option.
4. A **final summary report** — performance + personalized study tips.

Backing all four: **checkpointed session state** that is the single source of truth and survives refresh / tab-kill.

---



### Success criteria (traced to acceptance criteria)


| #   | Measurable "done"                                                                                                                                       | AC                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| S1  | PDF accepted, relevant text extracted (non-empty, faithful).                                                                                            | AC1               |
| S2  | A plan (objectives + difficulty, as a todo list) renders before any quizzing.                                                                           | AC2               |
| S3  | The graph **genuinely pauses** at a LangGraph `interrupt`; user reviews; it **resumes from the same checkpoint** — and the pause **survives a reload**. | AC3               |
| S4  | Every MCQ's content is **grounded in the PDF**, not general knowledge.                                                                                  | AC4               |
| S5  | The MCQ widget renders with **radio selection + submit** from validated data.                                                                           | AC5               |
| S6  | Correct → **green** + explanation.                                                                                                                      | AC6               |
| S7  | Incorrect → **red** + hint, **retry with no penalty**.                                                                                                  | AC7               |
| S8  | User can progress through **all** objectives to completion.                                                                                             | AC8               |
| S9  | Final **summary + study tips** produced.                                                                                                                | AC9               |
| S10 | A help turn **never leaks the correct option** and **steers back** to the question.                                                                     | Desired-flow §3   |
| S11 | Session state is **resumable and consistent**; the report reflects true progress.                                                                       | Challenges #1, #5 |


---



## 3. Workflow, not agent (Gate 1)

**Decision**

EdPath is a **workflow** — a deterministic, engineer-controlled LangGraph with one bounded dynamic pocket.

**What varies**

The full path is drawable up front (the assignment's numbered "Desired Flow"); only *content* and *iteration count* vary at runtime, both bounded. The LLM never decides what step comes next.

### End-to-end control flow

```
(upstream) PDF upload → text extraction → pdfText, threadId
        │
        ▼
   [1] PLAN ───────────────► emit LessonPlan
        │
        ▼
   [2] ⏸ INTERRUPT: await approval        (HITL — survives refresh)
        ├─ request changes → back to [1]
        └─ approve
              │
              ▼  LEARNING LOOP (per objective)
        [3] GENERATE MCQ ──► emit MCQ
              │
              ▼
        [4] ⏸ AWAIT ANSWER  ──or── free-text help
              ├─ help → [4a] ASSIST (bounded) → back to [4]
              └─ answer → [5] GRADE (deterministic)
                    ├─ incorrect → red + hint → retry → [4]
                    └─ correct   → green + explanation → advance
                          ├─ more objectives → [3]
                          └─ done → [8] SUMMARIZE → END
```

---



### The one dynamic part, kept bounded

Node **[4a] ASSIST** (the "hint / learn more" turn, Challenge #2) is the only free-form pocket. It stays boxed in:

1. **Structurally contained** — a side edge off [4] whose *only* exit is back to [4]; it cannot advance, grade, re-plan, or end.
2. **Counted** — per-question help ceiling `MAX_HELP = 3` (locked — B3), then steers back.
3. **Guardrailed** — never receives `correctIndex`; must help *and* steer back (S10).
4. **No tools, no exploration** — a single LLM call, so it is not an agent loop.

---



## 4. System components & data flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  apps/edpath-web  (Next.js)                                                 │
│  PDF upload · CopilotKit chat surface · plan-approval widget ·             │
│  MCQ genUI widget (radios + submit, green/red) · summary view ·           │
│  useCoAgent → mirrors agent state into React                              │
└──────────┬───────────────────────────────────────────────┬───────────────┘
           │ (a) PDF upload (multipart)                      │ (c) CopilotKit
           ▼                                                 ▼     runtime protocol
┌──────────────────────────────────────────────────────────────────────────┐
│  apps/edpath-backend  (Express)                                            │
│  (a) /upload → PDF text extraction → cleaned pdfText                       │
│  (b) starts/owns the LangGraph run (threadId)                             │
│  (c) hosts the CopilotKit Runtime endpoint (the bridge)                   │
│  Zod-validates every artifact before it leaves the backend                │
└──────────┬───────────────────────────────────────────────┬───────────────┘
           ▼                                                 ▼
┌────────────────────────────────┐         ┌──────────────────────────────┐
│  LangGraph agent (TS)           │ ──────► │  LLM (OpenAI)                 │
│  nodes N1–N9, 2 interrupts      │ ◄────── │  generative nodes only        │
│  state = single source of truth │         └──────────────────────────────┘
│  checkpointer (durable/resume)  │
└──────────┬─────────────────────┘
           ▼ checkpoints per threadId
┌────────────────────────────────┐         ┌──────────────────────────────┐
│  Checkpoint store (Postgres)    │         │  LangSmith (tracing, day one) │
└────────────────────────────────┘         └──────────────────────────────┘
```

**Happy path**

1. Upload PDF → `edpath-web` POSTs to `edpath-backend /upload`.
2. Backend **extracts + cleans** text → `pdfText`; **rejects empty/unparseable PDFs here** (fail fast — Challenge #3). Extraction lives outside the graph, so the graph only starts on good text.
3. Backend starts the graph with a `threadId`, seeding `pdfText`.
4. `plan` runs → `approval_gate` **interrupt** → state checkpointed → halt.
5. State mirrors to the UI via CopilotKit; plan renders for approval.
6. Approve → resume → quiz loop; each MCQ mirrors to the widget; `await_input` interrupt pauses for answer/help.
7. Submit → deterministic grade → green/red feedback → retry or advance.
8. All objectives done → `summarize` → report renders → END.
9. Every step traced to LangSmith; every artifact Zod-validated at the backend boundary.

---



## 5. The CopilotKit bridge ⚠️ verify against current CopilotKit docs

CopilotKit **CoAgents** is the LangGraph integration layer:

**Backend**

the **CopilotKit Runtime** is hosted as an endpoint in `edpath-backend` (Express), wired to the LangGraph agent as a CoAgent; it brokers messages, state sync, and interrupt/resume.

**Frontend**

`<CopilotKit>` provider + a CoAgent hook (e.g. `useCoAgent`) **mirrors LangGraph state into React**, driving the plan, current MCQ, and `phase`.

**Generative UI**

the MCQ widget and plan-approval surface render via CopilotKit's generative-UI mechanism, bound to mirrored state.

**HITL approval**

CopilotKit surfaces the LangGraph `interrupt` and sends the resume (Challenge #1 — the most-probed piece).

> 🚩 **Verify before building (API drifts between CopilotKit versions):**
>
> 1. Precise CoAgents interrupt/resume API and state-mirroring hook names/shapes.
> 2. CopilotKit Runtime running cleanly under **Express** (locked) vs. a Next.js route handler.
> 3. How generative-UI rendering binds to interrupt payloads, and how the pause survives a refresh.

---



## 6. Storage — pressure-tested

The only durable surface is the **LangGraph checkpoint** (the state object per `threadId`) — that *is* progress, plan, score, and the resume point. There is no separate domain data model.

- **Postgres — keep, as the LangGraph checkpointer backend** (not a hand-designed app schema). It survives process restart and refresh, which reviewers will test. (SQLite/in-memory checkpointer is fine for pure local dev.)
- **Redis — drop from v1.** Nothing hot to cache (`pdfText` is in graph state; LLM outputs are one-shot); the checkpointer is the session store; CopilotKit handles UI streaming for one user. Redis would add failure surface for zero current requirement.

> **Storage (locked — C5 / D5):** Postgres only, as the LangGraph checkpointer backend; no Redis in v1. Revisit Redis only on a concrete trigger (multi-user concurrency, rate-limiting, cross-instance streaming, or a measured cache need).

---



## 7. Responsibility boundaries


| Layer                              | Owns                                                                                                                                                                                  | Does **not** own                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Frontend (**`edpath-web`**)**    | Rendering: upload UI, plan-approval widget, MCQ widget (radios/submit, green/red), summary; mirroring agent state via CopilotKit; sending intents (approve, answer index, help text). | No business logic, no grading, **no progress/score state** (no ad-hoc client state), no LLM calls. |
| **Backend (**`edpath-backend`**)** | PDF extraction + cleaning; starting/owning graph runs (`threadId`); hosting the CopilotKit Runtime; **Zod-validating every artifact** at the boundary; wiring tracing + checkpointer. | No pedagogical decisions; no UI rendering.                                                         |
| **Agent (LangGraph)**              | The whole control flow (N1–N9, branches, interrupts), the **single-source-of-truth state**, deterministic grading, bounded loops.                                                     | No transport/protocol; no extraction; no rendering.                                                |
| **LLM (OpenAI)**                   | Filling content at generative nodes only; returning schema-valid artifacts.                                                                                                           | **Never** chooses control flow, grades, or sees `correctIndex` in assist.                          |
| **Shared packages**                | `schemas` (Zod contracts, one source of truth both ends), `ui` (shared widgets), `tokens` (green/red functional feedback).                                                            | —                                                                                                  |


---



## 8. Stack (locked)

- TypeScript (strict) everywhere
- **LangGraph** (agent)
- **CopilotKit / CoAgents** (UI bridge, generative UI, HITL)
- **Next.js** (`apps/edpath-web`)
- **Express** (`apps/edpath-backend`, hosts CopilotKit Runtime)
- **PostgreSQL** (checkpointer backend)
- **Redis** (deferred, not in v1)
- **LangSmith** (tracing)
- monorepo with shared `packages/` (`schemas`, `ui`, `tokens`, configs)

---



## 9. Resolved in `design-decisions.md`

The items this document previously left `PROVISIONAL` are now locked in `design-decisions.md` and reconciled above:

**Locked (resolved in** `design-decisions.md`**)**

- PDF size/page ceiling and extraction strategy for messy/scanned PDFs → **D3 / B6** (≈50 pages / 50K tokens / 200K chars; whole cleaned text in context; reject scanned/oversized; no OCR).
- Quiz shape: N MCQs per objective vs. one → **D2 / B1** (fixed `N = 3`, generated lazily per objective, presented one at a time).
- Scoring rule for "retry without penalty" → **D5 / D10 / D13** (`results[]` canonical; `score` derived; retries never reduce score).
- Difficulty representation in the plan → **D17** (`difficulty: "easy" | "medium" | "hard"`).
- Per-question retry cap, help-turn cap, max objectives, per-run cost ceiling → **B2 / B3 / B4 / B7** (`MAX_ATTEMPTS = 3`, `MAX_HELP = 3`, ≤ 8 objectives, ≈1.5M tokens/thread).
- Final state-storage lock → **C5 / D5** (Postgres-only checkpointer; Redis deferred).

