# EdPath — Database Schema

> Source of truth: [`assignment.md`](./assignment.md), [`architecture.md`](./architecture.md), [`agent-architecture.md`](./agent-architecture.md), [`challenges.md`](./challenges.md), and the locked [`design-decisions.md`](./design-decisions.md).
>
> This document is the conceptual database design for EdPath v1: what is persisted, where, and — critically — what is deliberately *not* given a custom table and why. No SQL DDL, no ORM models, no migrations.

---

## 1. Conclusion (up front)

**EdPath v1 has zero bespoke application tables.** The LangGraph checkpointer — backed by Postgres — is the entire persistence layer. There is no hand-designed domain schema sitting alongside it.

This is a deliberate architecture choice, not an omission. It is the direct consequence of three locked decisions:

- **C5 / D5 — State Storage.** The *full* graph-state object is checkpointed to Postgres at every super-step and interrupt. Progress, score inputs, `questions[]`, attempts, and the summary do not live anywhere else. `results[]` is canonical; `score` is a derived projection.
- **D19 — Lesson Memory Scope.** One `threadId` = one PDF lesson. No cross-lesson memory in v1.
- **D24 — User Freedom.** Resume is supported; restart creates a *new* `threadId`. No "list my lessons" history exists.

Everything EdPath persists is **operational lesson state** keyed by `threadId`, and the checkpointer already persists exactly that. A custom table would only be justified for data that must be queried *across* sessions, read *outside* a graph run, or persisted *independently* of a thread's lifecycle — and v1 has none of that.

The remainder of this document shows the reasoning that produced this conclusion, names every candidate that was rejected, describes the persistence model the checkpointer actually provides, and records the explicit triggers that would introduce the first custom table in a future version.

---

## 2. The reasoning chain — Bucket A vs. Bucket B

Before drawing any table, the governing rule (`agent-architecture.md` Gate 0 non-goals; `architecture.md §6`) requires splitting EdPath's data into two buckets:

- **Bucket A — operational lesson state the checkpointer already owns.** The live run: plan, current objective/question, attempts, score, resume point. Designing tables for this is duplication and is forbidden.
- **Bucket B — data the checkpointer is the wrong home for.** Anything that must be queried across sessions, read outside a graph run, or persisted independently of a thread's lifecycle (e.g. a queryable record of uploaded PDFs, a history of completed lessons).

**A table earns a place only if it is Bucket B.** Each Bucket B candidate must name a specific requirement the checkpointer provably cannot serve. If it cannot be justified against the checkpointer, it is not included.

### Every state field is Bucket A

The locked "what must survive" list (D5; `agent-architecture.md §5.1`) maps entirely to Bucket A. The checkpointer persists each of these per `threadId`:

| State field | Type (contract level) | Bucket | Why the checkpointer owns it |
|---|---|---|---|
| `pdfText` | `string` | **A** | Grounding source seeded at run start; lives in the checkpoint snapshot. |
| `pdfMeta` | `{ filename, charCount, pageCount }` | **A** | Provenance carried inside state. |
| `plan` | `LessonPlan \| null` | **A** | Approved objective list; a live run artifact. |
| `approval` | `{ decision, note? } \| null` | **A** | HITL outcome; drives the N2 → N1/N3 branch. |
| `currentObjectiveIndex` | `number` | **A** | Outer-loop pointer = the resume point. |
| `questions` | `MCQ[]` | **A** | Durable once generated; never regenerated on resume (D5). |
| `currentQuestionIndex` | `number` | **A** | Inner-loop pointer. |
| `selectedIndex` | `number \| null` | **A** | Submitted option for the current attempt. |
| `attempts` | `number` | **A** | Per-question attempt counter (retry + scoring). |
| `helpTurnsUsed` | `number` | **A** | Bounds the assist pocket (`MAX_HELP = 3`). |
| `results` | `ObjectiveResult[]` | **A** | Canonical per-question progress record. |
| `score` | `{ correct, total, firstTry }` | **A** | Derived projection of `results[]`; not independently stored. |
| `summary` | `Summary \| null` | **A** | Final report artifact. |
| `messages` | `Message[]` | **A** | Thread-local chat history (D20). |
| `phase` | enum | **A** | UI re-render hint after refresh. |
| `lastError` | `{ node, kind, detail } \| null` | **A** | Reliability/recovery. |

There is no Bucket A field that needs a second home. The checkpointer is the single source of truth for all of it, and that is precisely what makes refresh/resume (Challenge #1) and state-as-source-of-truth (Challenge #5) work.

---

## 3. The rejection list (the core of this document)

Three — and only three — pieces of data sit at or just outside the graph boundary, where a custom table could conceivably be justified. Each was examined as a Bucket B candidate. **All three are rejected.** This list is the substance of the schema design: the schema is empty *because* each candidate fails its justification, not by default.

### Rejected #1 — The uploaded PDF binary

- **What it would hold.** The original uploaded PDF file (bytes), plus upload metadata.
- **Could the checkpointer hold it?** Not relevant — the checkpointer holds extracted `pdfText`, not the binary, by design.
- **Why rejected:** **extract-and-discard; no requirement re-accesses the original file.** Per `architecture.md §4`, the binary is uploaded to `/upload`, text is extracted and cleaned into `pdfText`, and `pdfText` seeds the graph. Nothing downstream ever reads the original file again — every generative node grounds on `pdfText`, which already lives in state. There is no re-download, re-parse, or "view original PDF" feature in scope (no multi-PDF, single lesson per thread). Storing the binary would add a blob store and a table serving zero current read path.
- **Trace:** `architecture.md §4` (extraction upstream of the graph), D3 (whole cleaned text in context), D19 (one PDF per lesson).

### Rejected #2 — A record / index of uploads or completed lessons ("lesson history")

- **What it would hold.** A queryable row per lesson/upload (e.g. `lesson_id`, `threadId`, `filename`, `created_at`, `status`, `score`) to power a "my lessons" list across sessions.
- **Could the checkpointer hold it?** The data exists inside each thread's checkpoint, but the checkpointer is keyed by `threadId` and is not the right surface for a *cross-thread* list query — so this would genuinely be Bucket B **if the requirement existed.**
- **Why rejected:** **no such requirement.** D19 locks one `threadId` = one PDF lesson with no cross-lesson memory. D24 locks restart = a new `threadId`, with skip/back out of v1. The assignment deliverables (a single end-to-end lesson flow + summary) contain no list-view, no history, no "resume a past lesson from a menu." A lesson-history table would be a speculative table for a feature that does not exist — exactly what the scope rules forbid.
- **Trace:** D19, D24, `assignment.md` acceptance criteria (no history/list feature), `architecture.md §1` scope fence (no multi-PDF, no multi-user).

### Rejected #3 — A server-side `threadId` / session mapping

- **What it would hold.** A mapping from some session or user identifier to the active `threadId`, so the server can re-attach a returning client to its run.
- **Could the checkpointer hold it?** No — by definition this is a lookup *into* the checkpointer, so it would be Bucket B **if it were needed server-side.**
- **Why rejected:** **the `threadId` is client-held.** Per `architecture.md §5.4`, on refresh "the frontend re-attaches to `threadId`" — the client holds it (URL / localStorage), sends it back, and the checkpointer rehydrates state from it. There is no auth and no multi-user (scope fence), so there is no server-side identity to map a thread to. A mapping table would store a relationship the client already carries.
- **Trace:** `architecture.md §5.4` (frontend re-attaches to `threadId`), `architecture.md §1` (no multi-user/auth), C5.

### What the rejection list establishes

Two of the three candidates (#1 PDF binary, #3 thread mapping) are rejected because **the checkpointer plus the client already cover them**. The third (#2 lesson history) is the only *true* Bucket B shape, and it is rejected because **the requirement does not exist in v1**. There is no fourth candidate: users/auth, analytics, and multi-tenant structures are all explicitly out of scope and were never candidates.

---

## 4. What the checkpointer actually persists (the real persistence model)

The schema is "empty," but EdPath is not storage-less. The persistence model below is owned by LangGraph and treated as a black box — I did **not** design these tables, and this section describes them only so the document explains the real model end to end.

### Conceptual model

- **Unit of persistence:** the **serialized graph-state object** (the full Bucket A field set in §2), not normalized domain rows.
- **Key:** `threadId`. One thread = one PDF lesson (D19). Restart mints a new `threadId` (D24).
- **Write cadence:** a **snapshot per super-step.** LangGraph writes a checkpoint after each node/super-step and at every interrupt, so the most recent durable snapshot always reflects the last completed step. This is what makes "resume from the same checkpoint, not a restart" true (`agent-architecture.md §5.4`).
- **Snapshot lineage:** checkpoints are an ordered, append-style series per thread (each referencing its parent), which is what enables durable resume and time-travel/replay if ever needed. v1 only relies on "latest snapshot for this thread."
- **Interrupt durability:** the two interrupts — `approval_gate` (N2) and `await_input` (N4) — persist state *before* halting. A reload or tab-kill mid-pause rehydrates from the latest snapshot, and `phase` tells the UI which surface to re-render (Challenge #1).
- **Backend:** Postgres in all durable environments (C5; `architecture.md §6`). SQLite/in-memory checkpointer is acceptable for pure local dev only.

### Where the data physically lives

LangGraph's Postgres checkpointer provisions and manages its own internal tables (conceptually: a checkpoints/snapshots table and a pending-writes table, keyed by thread and checkpoint id). **These are LangGraph's, created and migrated by the library — not application schema.** EdPath neither designs, owns, nor queries them directly; it interacts through the checkpointer/graph API (start run, resume with `Command(resume=…)`, read state for a `threadId`).

### Why this is sufficient

Every requirement that needs durability — refresh survival (S3/Challenge #1), retry-aware scoring from canonical `results[]` (S7/Challenge #5), accurate final report (S11), and resume-not-restart (D22) — is satisfied by "the full state object, snapshotted per super-step, keyed by `threadId`." No requirement needs a query the checkpointer cannot serve for a single thread. Hence: no custom tables.

---

## 5. Entity-relationship description

There are no application entities to relate, so there is no ER diagram in the conventional sense. The complete persistence picture is:

```
   client (browser)
   └─ holds threadId (URL / localStorage)        ← no server-side mapping (Rejected #3)
            │  sends threadId on every request / on refresh
            ▼
   LangGraph runtime  ──reads/writes──►  Postgres (LangGraph checkpointer tables)
   (graph state object)                  snapshot-per-super-step, keyed by threadId
            ▲                                   │
            └─────────── rehydrate on resume ───┘

   PDF binary ──/upload──► extract pdfText ──► seed state ──► (binary discarded)
                                                              ↑ no table (Rejected #1)

   (no lesson-history / list-view entity exists in v1)        ← no table (Rejected #2)
```

- **Cardinality that matters:** one `threadId` ↔ one lesson ↔ one current checkpoint snapshot (with a snapshot lineage behind it, owned by LangGraph). One lesson references exactly one `pdfText` held *inside* its own state — there is no separate PDF entity to foreign-key to.
- **How Bucket B would relate to a thread (if it existed):** a future Bucket B row would reference the run by storing the `threadId` as a plain column and would read run facts through the checkpointer/graph API — never by duplicating the state the checkpointer holds. v1 has no such row.

### Indexes

**None to design.** All indexing belongs to LangGraph's checkpointer tables (lookup by `threadId` / checkpoint id), which the library owns. EdPath defines no custom table, therefore no custom index, and there is no application access pattern that requires one (no cross-thread query exists). Adding a speculative index would violate the "only indexes a real query needs" rule.

---

## 6. Per-"table" justification

There are no tables to justify positively. The honest equivalent for this document is the inverse: a one-line justification for **why each thing that could have been a table is not one.**

| Candidate | Bucket | Verdict | One-line justification |
|---|---|---|---|
| Live lesson state (plan, questions, attempts, results, score, summary, messages, phase, …) | A | **Checkpointer** | Already the serialized state object per `threadId`; a table would duplicate it. |
| Uploaded PDF binary | — | **No table** | Extract-and-discard; nothing re-reads the original file (Rejected #1). |
| Lesson history / upload index | B | **No table** | No list-view feature exists in v1; D19 + D24 close it (Rejected #2). |
| `threadId` / session mapping | B | **No table** | `threadId` is client-held; no auth/multi-user to map to (Rejected #3). |
| Users / auth | — | **Out of scope** | No multi-user/auth in v1 (scope fence); never a candidate. |
| Analytics / cross-session metrics | — | **Out of scope** | No analytics requirement; would be speculative. |

---

## 7. Future triggers — what introduces the first custom table

This decision is **conditional and reversible**, not permanent. The schema stays empty until a concrete requirement crosses one of the lines below. These mirror the storage triggers in `architecture.md §6` and the locked decisions, and each names the *first* table it would force:

| Trigger | Why the checkpointer stops being sufficient | First table it introduces |
|---|---|---|
| **Lesson history / "my lessons" list-view** (reverses D19/D24 intent) | Needs a cross-thread query the checkpointer (keyed per `threadId`) is the wrong surface for. | A `lessons` index row per run: `{ id, threadId, filename, created_at, completed_at, status, overall_score }`. |
| **Multi-user / auth** (reverses the scope fence) | A user identity must own and be authorized against threads; the client can no longer be the sole holder of `threadId`. | A `users` table and a `user_id → threadId` ownership/mapping table. |
| **Cross-session analytics / reporting** | Aggregations across many lessons/users that should not scan checkpointer internals. | A read-model / analytics table fed from completed runs (not the checkpointer tables directly). |
| **Re-accessible PDF library / multi-PDF** (reverses D3/D19) | The original binary must be retrievable after a run; multiple PDFs per user must be listed. | A `pdf_documents` table plus a blob-store reference. |
| **Measured cache / hot-path need, cross-instance streaming, rate-limiting** | Operational need the checkpointer was never meant to serve. | Redis (per `architecture.md §6`) and any supporting table, not a checkpointer change. |

Until one of these is an actual locked requirement, introducing a table would be speculative and is explicitly out of scope.

---

## 8. Consistency check against the committed docs

This schema (the absence of one) was verified against the committed design and contradicts nothing:

- **`architecture.md §6` (Storage):** "The only durable surface is the LangGraph checkpoint … There is no separate domain data model." ✅ This document is that statement, expanded and justified. No conflict.
- **`agent-architecture.md §5.1` (state shape):** every field is treated as Bucket A, checkpointer-owned, matching the locked "what must survive" list exactly. No field is relocated to a custom table. ✅
- **`design-decisions.md` C5 / D5 / D19 / D24:** Postgres-as-checkpointer, full-state checkpointing, one-thread-per-lesson, restart-as-new-thread — all upheld. ✅
- **Scope rules (`architecture.md §1`, `agent-architecture.md` Gate 0 non-goals):** no auth/users, no multi-PDF, no analytics, no multi-tenant tables introduced. ✅

**No edits to the committed docs are implied by this schema.** It is a faithful, more detailed restatement of the storage position those documents already lock. (Note: `design-decisions.md §5` already lists the doc follow-ups implied by the decision session; none of them concern a database schema, consistent with this conclusion.)

---

## 9. Summary

EdPath v1's database schema is intentionally empty of bespoke application tables. The LangGraph Postgres checkpointer persists the full lesson-state object as a snapshot per super-step, keyed by `threadId`, and that single mechanism satisfies every durability requirement in the contract: refresh survival, retry-aware scoring, accurate final reporting, and resume-from-checkpoint. The three candidate tables (PDF binary, lesson history, thread mapping) are each rejected — two because the checkpointer plus the client already cover them, one because the requirement does not exist in v1. The first custom table appears only when a named future trigger — lesson history, multi-user/auth, analytics, or a re-accessible PDF library — crosses a line this document records. This is a deliberate, minimal, and reversible architecture choice, and it is the correct one for the locked scope.
```