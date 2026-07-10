# EdPath — Design Decisions

> Source of truth: [`assignment.md`](./assignment.md), [`architecture.md`](./architecture.md), [`agent-architecture.md`](./agent-architecture.md), and [`challenges.md`](./challenges.md).
>
> This document records the product design decisions locked for EdPath. It does not reopen the committed architecture. Decisions already settled in the architecture files are recorded as `LOCKED (from architecture)` with pointers.

## Table of Contents

- [0. Session Scope](#0-session-scope)
- [1. Closed Decisions](#1-closed-decisions)
  - [C1. Overall Philosophy](#c1-overall-philosophy)
  - [C2. Knowledge Representation](#c2-knowledge-representation)
  - [C3. Source Grounding](#c3-source-grounding)
  - [C4. Reliability vs. Intelligence](#c4-reliability-vs-intelligence)
  - [C5. State Storage](#c5-state-storage)
  - [C6. Framework, UI, and Stack](#c6-framework-ui-and-stack)
- [2. Load-Bearing Decisions](#2-load-bearing-decisions)
  - [D1. Interaction Flow](#d1-interaction-flow)
  - [D2. Quiz Generation Granularity](#d2-quiz-generation-granularity)
  - [D3. PDF Ingestion Strategy](#d3-pdf-ingestion-strategy)
  - [D4. Quiz Generation Reliability](#d4-quiz-generation-reliability)
  - [D5. Lesson State Management](#d5-lesson-state-management)
- [3. Remaining Decisions](#3-remaining-decisions)
  - [D6. Human Approval UX](#d6-human-approval-ux)
  - [D7. Plan Modification Mechanism](#d7-plan-modification-mechanism)
  - [D8. Quiz Delivery Style](#d8-quiz-delivery-style)
  - [D9. Submission Strategy](#d9-submission-strategy)
  - [D10. Retry Strategy](#d10-retry-strategy)
  - [D11. Hint Reveal Level](#d11-hint-reveal-level)
  - [D12. Feedback Detail](#d12-feedback-detail)
  - [D13. Progression Rule](#d13-progression-rule)
  - [D14. Summary Timing](#d14-summary-timing)
  - [D15. Performance Report Contents](#d15-performance-report-contents)
  - [D16. Question Quality Control](#d16-question-quality-control)
  - [D17. Difficulty Strategy](#d17-difficulty-strategy)
  - [D18. Custom MCQ Widget Affordances](#d18-custom-mcq-widget-affordances)
  - [D19. Lesson Memory Scope](#d19-lesson-memory-scope)
  - [D20. Conversation Memory Scope](#d20-conversation-memory-scope)
  - [D21. Cost vs. Quality](#d21-cost-vs-quality)
  - [D22. Recovery Strategy Per Failure](#d22-recovery-strategy-per-failure)
  - [D23. Completion Criteria](#d23-completion-criteria)
  - [D24. User Freedom](#d24-user-freedom)
- [4. Numeric Bounds](#4-numeric-bounds)
  - [B1. MCQs Per Objective](#b1-mcqs-per-objective)
  - [B2. Max Attempts Per Question](#b2-max-attempts-per-question)
  - [B3. Max Help Turns Per Question](#b3-max-help-turns-per-question)
  - [B4. Max Objectives Per Plan](#b4-max-objectives-per-plan)
  - [B5. Repair Retries Per Node](#b5-repair-retries-per-node)
  - [B6. PDF Ingestion Ceiling](#b6-pdf-ingestion-ceiling)
  - [B7. Per-Run Token/Cost Ceiling](#b7-per-run-tokencost-ceiling)
  - [B8. Model Per Node](#b8-model-per-node)
  - [B9. Prompt Caching](#b9-prompt-caching)
- [5. Architecture Edits Flagged By These Locks](#5-architecture-edits-flagged-by-these-locks)
- [6. Final Lock Summary](#6-final-lock-summary)

---

## 0. Session Scope

**Assignment restated**

EdPath turns one uploaded PDF into a guided, interactive lesson:

`Plan -> Approve -> Quiz loop -> Summarize`

The system must produce

- a learning plan
- pause for human approval
- teach through MCQs in a custom UI widget
- provide green/red feedback
- allow no-penalty retries with hints
- support bounded help turns that do not leak the answer
- survive refresh/resume through checkpointed state
- and finish with a performance report plus study tips

**Scope locked**

This session locks design decisions only. It produces this document. It does not implement application code and does not reopen `architecture.md` or `agent-architecture.md`.

---

## 1. Closed Decisions

These decisions were already settled in the architecture files. They are recorded here, not relitigated.

### C1. Overall Philosophy

**Question**

Is EdPath a deterministic teaching workflow or an autonomous chatbot/agent?

**Options considered**

- Deterministic LangGraph workflow
- open-ended autonomous agent
- chatbot wrapper

**Trade-off**

A deterministic workflow gives less autonomy, but it makes the assignment's fixed pedagogical arc, HITL pause, retry loop, and final state easier to reason about and test.

> **LOCKED (from architecture).** EdPath is a deterministic teaching system powered by an LLM: a LangGraph workflow, not a chatbot and not an autonomous agent. See `architecture.md §3` and `agent-architecture.md Gate 1`.

**Why this, for this assignment**

The acceptance criteria reward reliable control flow, not agent autonomy.

### C2. Knowledge Representation

**Question**

How should the uploaded PDF be represented for the agent?

**Options considered**

- Plain parsed PDF text in context
- structured hierarchy
- Neo4j/knowledge graph
- vector store/RAG

**Trade-off**

Plain text is simpler and bounded, but it cannot scale to arbitrary document collections; graphs/vector stores add retrieval failure modes and architecture surface the assignment does not require.

> **LOCKED (from architecture).** Use plain cleaned PDF text in context. No structured hierarchy, no Neo4j, no knowledge graph, and no vector store. See `architecture.md §1` and `agent-architecture.md Gate 2`.

**Why this, for this assignment**

The product handles one bounded PDF, so retrieval infrastructure would add risk without improving the required demo.

### C3. Source Grounding

**Question**

What is the source of truth for plans, MCQs, explanations, hints, and summaries?

**Options considered**

- PDF-first grounding
- model general knowledge
- mixed PDF plus general knowledge

**Trade-off**

PDF-first grounding limits breadth but keeps the lesson faithful to the uploaded source.

> **LOCKED (from architecture).** Plan, MCQs, explanations, hints, and summaries derive from `pdfText`, not general model knowledge. See `agent-architecture.md Gate 0`.

**Why this, for this assignment**

AC4 requires quiz questions to be grounded in the PDF.

### C4. Reliability vs. Intelligence

**Question**

Should EdPath optimize for maximum model cleverness or deterministic reliability?

**Options considered**

- Reliability-first workflow
- more adaptive/intelligent agent behavior

**Trade-off**

Reliability-first reduces adaptivity but makes the system testable and refresh-safe.

> **LOCKED (from architecture).** Optimize for determinism and reliability over maximum cleverness. See `architecture.md §3` and `challenges.md`.

**Why this, for this assignment**

The likely review probes are interrupt survival, grounding, no-leakage, schema validity, and state consistency.

### C5. State Storage

**Question**

What durable store owns lesson progress?

**Options considered**

- Postgres checkpointer
- Redis
- custom app schema
- in-memory only

**Trade-off**

Postgres as checkpointer is enough for durable runs; Redis would add operational surface before there is a hot/cache/shared-streaming need.

> **LOCKED (from architecture).** Use Postgres as the LangGraph checkpointer backend. No Redis in v1. Redis trigger conditions: multi-user concurrency, rate-limiting, cross-instance streaming, or a measured cache need. See `architecture.md §6`.

**Why this, for this assignment**

Refresh/resume needs durable checkpoint state, not a separate cache tier.

### C6. Framework, UI, and Stack

**Question**

What agent framework and application stack are used?

**Options considered**

- Locked stack from architecture
- alternative frameworks/stores/UI bridges

**Trade-off**

Staying on the chosen stack avoids churn and keeps implementation focused on the acceptance criteria.

> **LOCKED (from architecture).** LangGraph, CopilotKit CoAgents, Next.js web app, Express backend, TypeScript, shared packages, Postgres checkpointer, and LangSmith tracing. See `architecture.md §8`.

**Why this, for this assignment**

The architecture already commits to the stack needed for HITL, generative UI, checkpointing, and tracing.

---

## 2. Load-Bearing Decisions

These five decisions determine whether EdPath feels like a real teaching system or a chatbot/quiz wrapper.

### D1. Interaction Flow

**Question**

Does the learner answer one MCQ at a time, or a batch of questions at once?

**Options considered**

- Sequential one-at-a-time MCQs: render one question, submit, grade, show feedback, retry or advance.
- Batch form: render all questions for an objective together and grade as a set.

**Trade-off**

Sequential flow costs one interrupt/resume cycle per question, but makes feedback, hinting, and no-penalty retry first-class. Batch flow has fewer round trips, but it behaves like a test form and makes per-question hint-then-retry ambiguous.

**Failure mode if chosen wrong**

Batch delivery weakens AC7: incorrect -> red -> hint -> retry the same question with no penalty. That is the most visible way the product would feel like a quiz form instead of a guided teaching system.

> **LOCKED.** One MCQ at a time. The `await_input` interrupt is per question; grade, feedback, retry, and advance operate on a single active question.

**Why this, for this assignment**

The desired flow is explicitly a per-question teaching loop with hints and retries.

**State impact**

- The state keeps `questions: MCQ[]` and `currentQuestionIndex`; the UI presents one active question from that list.

---

### D2. Quiz Generation Granularity

**Question**

How many MCQs should each objective carry, and when are they generated?

**Options considered**

- One MCQ per objective.
- Fixed small N per objective, default 3, generated as one batch when entering the objective and presented one at a time.
- Variable N decided by the LLM per objective.

**Trade-off**

One MCQ keeps state simplest but produces a weak mastery signal and trivial summary denominators. Fixed N keeps cost and behavior bounded while giving real per-objective stats. Variable N is more adaptive but less deterministic and harder to cost/evaluate.

**Failure mode if chosen wrong**

One MCQ makes the final report shallow. Variable N makes cost, runtime, and evals less predictable.

> **LOCKED.** Fixed N per objective, default 3, generated lazily per objective in one batched LLM call at N3 and presented one at a time.

**Why this, for this assignment**

It gives meaningful performance data while preserving deterministic, bounded execution.

**State impact**

- `questions: MCQ[]` is confirmed.
- `currentQuestionIndex: number` is confirmed.
- `currentObjectiveIndex: number` remains the outer-loop pointer.
- The N8 inner-loop edge, `more questions in objective -> N4`, remains live.
- `summary.perObjective[].firstTryRate` has a real denominator: 3 by default.

---

### D3. PDF Ingestion Strategy

**Question**

What PDF size/page ceiling should v1 support, should ingestion parse whole/page/section, and how should messy or scanned PDFs behave?

**Options considered**

- Parse the whole cleaned PDF text and pass it in context with a hard ceiling.
- Page/section chunking with selective inclusion.
- OCR fallback for scanned PDFs.

**Trade-off**

Whole-text parsing is the only option consistent with the no-RAG architecture: the complete source rides in context and every node uses the same bounded grounding document. Chunking becomes retrieval-adjacent and reintroduces retrieval misses. OCR supports scanned PDFs but adds accuracy, layout, latency, and cost complexity outside the assignment.

**Failure mode if chosen wrong**

Accepting empty/scanned/garbage text causes the model to fill gaps from general knowledge, violating PDF grounding. Setting the ceiling too high increases cost and dilutes plan quality.

> **LOCKED.** Parse the whole cleaned text in context. Default ceiling is about 50 pages, 50K tokens, or 200K cleaned characters, flagged tunable. Reject above the ceiling. Reject scanned/image-only or low-quality extraction with a clear upload error. No OCR in v1.

**Why this, for this assignment**

It honors "in-context, no RAG" while failing fast on inputs that would otherwise create hallucinated lessons.

**State impact**

- `pdfText: string` remains the grounding source.
- `pdfMeta` should include `{ filename, charCount, pageCount }`.
- Extraction quality is gated upstream and does not need to live in graph state.

---

### D4. Quiz Generation Reliability

**Question**

How do MCQs stay tightly grounded in the PDF, and does an optional LLM grounding self-check belong in v1?

**Options considered**

- Inline LLM grounding self-check: generate MCQs, then run a second LLM pass to validate grounding.
- Deterministic source-anchor check plus offline evals: require source evidence in the MCQ artifact and verify it against `pdfText`.

**Trade-off**

An inline LLM check can catch some issues but doubles runtime cost/latency and asks an LLM to judge an LLM. A source-anchor check is cheaper and deterministic on the key fact: whether the cited source text is actually present in the PDF.

**Grounding and validation ladder**

1. Generate with full `pdfText`, current objective, source-only prompt, low temperature where supported, and mandatory `sourceQuote`.
2. Validate the returned artifact with Zod at the backend boundary.
3. Run deterministic structural checks: `correctIndex` in range, exactly 4 options, non-empty unique options, non-empty question.
4. Run deterministic grounding check: each `sourceQuote` must match `pdfText` after normalization.
5. If validation fails, bounded repair retry up to 2 times; after that, node-level error and no state advance.
6. Use offline evals to catch systemic grounding failures.

**Failure mode if chosen wrong**

Prompt-only grounding can produce well-shaped but invented MCQs that pass Zod and reach the learner. Shipping an inline LLM self-check by default increases cost for a weaker, non-deterministic guarantee.

> **LOCKED.** Per-objective generation with source-only prompting, mandatory `sourceQuote`, Zod validation, structural checks, deterministic source-anchor check, bounded repair-retry, and offline evals. Inline LLM grounding self-check is deferred as an escape hatch.

**Why this, for this assignment**

It makes grounding checkable in code instead of relying on a prompt or a second model call.

**State/schema impact**

- `MCQ` gains `sourceQuote: string`.
- `sourceQuote` is backend grounding evidence and does not need to be rendered.
- `sourceQuote` joins `correctIndex` behind the assist firewall. N5 assist receives question/options only, not `correctIndex`, `explanation`, `hint`, or `sourceQuote`.

---

### D5. Lesson State Management

**Question**

What survives refresh/resume, and how does the `phase` field map to UI and graph state?

**Options considered**

- Entire graph state object checkpointed; no progress state client-side.
- Hybrid durable/transient model: checkpoint some data but keep UI progress in React/client state.

**Trade-off**

Full checkpointed state is stricter and slightly heavier, but it gives one source of truth for refresh, retry scoring, and final reporting. Hybrid state may feel convenient but risks refresh wiping progress or corrupting score/report data.

**Failure mode if chosen wrong**

Regenerating questions on resume can show a different question mid-objective and invalidate attempts/score. Client-held progress can vanish on refresh and produce a wrong final report.

> **LOCKED.** The full state object is checkpointed at every super-step and interrupt. Progress, score inputs, questions, attempts, and summary do not live client-side. `questions[]` is persisted and never regenerated on resume. `results[]` is canonical; `score` is derived from `results`.

**Why this, for this assignment**

Reviewers will stress-test refresh/tab-kill behavior and final report correctness; both require checkpointed state as the single source of truth.

**What must survive**

`pdfText`, `pdfMeta`, `plan`, `approval`, `currentObjectiveIndex`, `questions[]`, `currentQuestionIndex`, `selectedIndex`, `attempts`, `helpTurnsUsed`, `results[]`, `summary`, `messages[]`, `phase`, and `lastError`.

**Phase mapping**

- `planning`: N1 transient planning/loading.
- `awaiting_approval`: N2 interrupt and plan approval widget.
- `quizzing`: N3 transient MCQ generation.
- `awaiting_input`: N4 interrupt and MCQ widget, including submitted feedback/retry state.
- `complete`: N9 summary view.

**State impact**

No new phase is needed. Clarify `score` as derived from `results[]`, and clarify that `questions[]` is durable once generated.

---

## 3. Remaining Decisions

These are locked as simple v1 defaults. Each is intentionally short unless it changes architecture.

### D6. Human Approval UX

**Question**

What actions should the plan approval widget expose?

**Options considered**

- Approve only
- approve/edit
- approve/edit/chat-to-revise

**Trade-off**

More affordances add UI surface, but plan review is the mandatory HITL point and needs a way to request changes.

> **LOCKED.** Provide Approve, Edit-then-approve, and Chat-to-revise.

**Why this, for this assignment**

It satisfies HITL without introducing an autonomous re-planning agent.

**Architecture impact**

`approval.note` feeds the N1 re-plan prompt when `approval.decision === "changes"`.

### D7. Plan Modification Mechanism

**Question**

How are requested plan changes applied?

**Options considered**

- Patch/diff the existing plan
- full re-plan using the user's note
- manual-only edit

**Trade-off**

Patch logic is more precise but adds complexity; full re-plan reuses N1 and keeps behavior simple.

> **LOCKED.** Re-run N1 with `pdfText` plus the user's change note. No diff/patch logic.

**Why this, for this assignment**

It is deterministic enough and reuses the existing planning node.

### D8. Quiz Delivery Style

**Question**

How should questions appear during the lesson?

**Options considered**

- One MCQ card
- batch page
- chat-only question

**Trade-off**

One card makes the teaching loop explicit; batch or chat-only weakens the custom widget requirement.

> **LOCKED.** One MCQ card at a time, advance only after feedback is shown.

**Why this, for this assignment**

It matches AC5-AC7 and the locked interaction flow.

### D9. Submission Strategy

**Question**

When is an answer submitted?

**Options considered**

- Auto-submit on radio selection
- explicit Submit button

**Trade-off**

Auto-submit is faster but easy to trigger accidentally; explicit submit gives the learner a deliberate commit point.

> **LOCKED.** Use an explicit Submit button. Resume payload carries `selectedIndex`.

**Why this, for this assignment**

It cleanly separates selection from answer submission for the interrupt payload.

### D10. Retry Strategy

**Question**

What happens after an incorrect answer?

**Options considered**

- Same-question retry
- new replacement question
- immediate reveal and advance

**Trade-off**

Same-question retry supports learning but needs bounded attempts; replacement questions complicate scoring; immediate reveal undercuts AC7.

> **LOCKED.** Re-enable the same question after an incorrect answer, increment `attempts`, and retry until correct or `MAX_ATTEMPTS`.

**Why this, for this assignment**

It directly implements no-penalty retry.

### D11. Hint Reveal Level

**Question**

How much can hints reveal?

**Options considered**

- Conceptual nudge
- option elimination
- direct answer reveal

**Trade-off**

Stronger hints may help faster, but they risk answer leakage.

> **LOCKED.** Hints are conceptual nudges only. They may point at the relevant idea/source area but must not name, eliminate, or imply the correct option.

**Why this, for this assignment**

The assignment explicitly forbids answer leakage.

### D12. Feedback Detail

**Question**

What feedback appears after submission?

**Options considered**

- Minimal correct/incorrect
- detailed explanation/hint
- fresh LLM-generated feedback

**Trade-off**

Detailed feedback is better instructionally, but fresh generation after submit risks leakage and cost.

> **LOCKED.** Correct shows green highlight plus explanation. Incorrect shows red highlight plus hint plus retry. Feedback is assembled from the validated MCQ, not freshly generated.

**Why this, for this assignment**

It satisfies AC6/AC7 while keeping grading deterministic.

### D13. Progression Rule

**Question**

When does the learner advance to the next question?

**Options considered**

- Only when correct
- correct or max attempts exhausted
- always after one submit

**Trade-off**

Correct-only can soft-lock; one-submit undermines retry; max-attempt fallback keeps the loop bounded.

> **LOCKED.** Advance only when correct or when `MAX_ATTEMPTS` is exhausted. At the limit, reveal explanation, mark not-first-try, and advance.

**Why this, for this assignment**

It preserves retry while preventing infinite loops.

### D14. Summary Timing

**Question**

When is the final report generated?

**Options considered**

- After each objective
- on demand
- once at completion

**Trade-off**

Mid-lesson summaries add complexity and may distract; terminal summary is enough for AC9.

> **LOCKED.** Generate the summary once at N9 after the last objective.

**Why this, for this assignment**

AC9 asks for a final report, not continuous analytics.

### D15. Performance Report Contents

**Question**

What does the final performance report contain?

**Options considered**

- Overall score only
- per-objective metrics
- full transcript analysis

**Trade-off**

Per-objective metrics are useful without creating an oversized report.

> **LOCKED.** Include per-objective `{ correct, total, firstTryRate }`, overall metrics, and personalized study tips grounded in weak objectives.

**Why this, for this assignment**

N=3 per objective gives meaningful denominators for study guidance.

### D16. Question Quality Control

**Question**

What quality gates run before an MCQ reaches the widget?

**Options considered**

- Prompt-only
- schema-only
- schema plus deterministic structural and grounding checks

**Trade-off**

More checks add implementation work but catch well-formed hallucinations and widget-breaking data.

> **LOCKED.** Use the D4 validation ladder: Zod, structural checks, source-anchor grounding, and bounded repair retry.

**Why this, for this assignment**

GenUI must never receive invalid or ungrounded MCQ data.

### D17. Difficulty Strategy

**Question**

How is difficulty represented and adjusted?

**Options considered**

- No difficulty
- per-objective enum
- adaptive runtime difficulty

**Trade-off**

Runtime adaptivity is richer but less deterministic; an enum is visible and simple.

> **LOCKED.** Each plan objective includes `difficulty: "easy" | "medium" | "hard"`, set by N1 and shown in the approval widget. No runtime difficulty adaptation.

**Why this, for this assignment**

The assignment asks for objective difficulty in the plan, not an adaptive tutor.

**Architecture impact**

Confirms the provisional difficulty representation in `agent-architecture.md §5.5`.

### D18. Custom MCQ Widget Affordances

**Question**

What controls and states does the MCQ widget need?

**Options considered**

- Plain chat answers
- minimal radios
- full custom card with answer/feedback/help controls

**Trade-off**

Full widget state is more UI work but directly demonstrates generative UI and the teaching loop.

> **LOCKED.** Radios, Submit, disabled inputs after submit, green/red highlight, explanation or hint, Retry or Next, and a Help free-text affordance routed to N5.

**Why this, for this assignment**

It visibly satisfies AC5-AC7 plus the side-channel requirement.

### D19. Lesson Memory Scope

**Question**

How broadly does lesson memory persist?

**Options considered**

- One thread per PDF lesson
- cross-lesson memory
- user-level memory

**Trade-off**

Broader memory could personalize future lessons but introduces privacy, storage, and grounding scope questions.

> **LOCKED.** One `threadId` equals one PDF lesson. No cross-lesson memory in v1.

**Why this, for this assignment**

The contract is single-user, single-PDF, single-lesson.

### D20. Conversation Memory Scope

**Question**

What conversation history is stored and shown to the model?

**Options considered**

- Full conversation everywhere
- thread-local messages
- no messages

**Trade-off**

Full history increases context and leakage risk; thread-local messages are enough for UI continuity.

> **LOCKED.** `messages[]` is checkpointed for this thread only. Assist receives a minimal slice: active question and options, not full sensitive state.

**Why this, for this assignment**

It preserves lesson continuity while protecting the answer firewall.

### D21. Cost vs. Quality

**Question**

How many LLM calls should a typical lesson make, and which model should be the default?

**Options considered**

- Minimal calls
- one call per major node
- heavier model for all nodes

**Trade-off**

More calls improve structure but increase cost; heavier models everywhere are unnecessary for deterministic nodes and routine generation.

> **LOCKED.** Typical lesson uses about `1 plan + 1 MCQ generation per objective + assist as used + 1 summary` (roughly 5-8 calls typical). Default model is `gpt-4o-mini` (`OPENAI_MODEL`); `gpt-4o` (`OPENAI_PLAN_ESCAPE_MODEL`) is an escape hatch for plan quality.

**Why this, for this assignment**

It keeps the lesson bounded while preserving structured-output quality.

### D22. Recovery Strategy Per Failure

**Question**

How does the system recover from expected failures?

**Options considered**

- Best-effort continue
- fail-fast/no-advance
- bespoke recovery per node

**Trade-off**

Fail-fast/no-advance can interrupt the user, but prevents corrupt state.

> **LOCKED.** Adopt the `agent-architecture.md Gate 6` recovery table: upload reject, bounded node retry with no state advance, `GradingError` re-surface, checkpoint rehydrate on refresh, and durable resume from checkpoint.

**Why this, for this assignment**

Reliability failures should not silently mutate lesson progress.

### D23. Completion Criteria

**Question**

When is a lesson complete?

**Options considered**

- User stops manually
- all objectives visited
- all objectives visited plus summary generated

**Trade-off**

Requiring the summary adds one terminal step but gives a clear end-state.

> **LOCKED.** Lesson is complete when every planned objective has been visited once and N9 summary is produced.

**Why this, for this assignment**

It maps directly to AC8 and AC9.

### D24. User Freedom

**Question**

What navigation freedom does v1 allow?

**Options considered**

- Skip/back/pause/resume/restart
- pause/resume/restart only
- fully linear only

**Trade-off**

Skip/back offer flexibility but complicate retry-aware scoring and the linear teaching arc.

> **LOCKED.** Resume is supported. Pause is implicit at interrupts. Restart creates a new `threadId`. Skip/back are not in v1 and are recorded as escape hatches.

**Why this, for this assignment**

A deterministic linear lesson is easier to keep correct and sufficient for the acceptance criteria.

**Architecture impact**

Confirms no skip/back edges in `agent-architecture.md §5.3`.

---

## 4. Numeric Bounds

All numeric bounds are locked defaults and tunable after evals.

### B1. MCQs Per Objective

**Question**

How many MCQs are generated for each objective?

**Options considered**

- 1
- fixed 2-4
- variable LLM-decided count

**Trade-off**

More questions improve signal but increase runtime and cost.

> **LOCKED.** Default `N = 3` MCQs per objective, tunable between 2 and 4.

**Why this, for this assignment**

Three questions give useful summary metrics without making the lesson too long.

### B2. Max Attempts Per Question

**Question**

How many attempts can a learner make on one question?

**Options considered**

- Unlimited
- 5
- 3
- 1

**Trade-off**

More attempts increase learning time but allow brute force on 4-option MCQs.

> **LOCKED.** `MAX_ATTEMPTS = 3` total attempts: initial attempt plus 2 retries.

**Why this, for this assignment**

Three attempts preserve retry while staying below the number of options.

### B3. Max Help Turns Per Question

**Question**

How many side-channel help turns are allowed per question?

**Options considered**

- Unlimited
- 3
- 1
- none

**Trade-off**

More help supports learning but increases cost and leakage/tangent risk.

> **LOCKED.** `MAX_HELP = 3`.

**Why this, for this assignment**

Three help turns are enough for assistance while bounding the dynamic pocket.

### B4. Max Objectives Per Plan

**Question**

How many objectives can a plan include?

**Options considered**

- No cap
- 10
- 8 with a soft target of 4-6

**Trade-off**

More objectives cover more content but lengthen the lesson and raise cost.

> **LOCKED.** Hard cap 8 objectives; soft target 4-6.

**Why this, for this assignment**

With N=3, the hard cap bounds the lesson at 24 questions.

### B5. Repair Retries Per Node

**Question**

How many times should a generative node repair invalid output?

**Options considered**

- No repair
- 1 retry
- 2 retries
- unlimited retries

**Trade-off**

Repair retries improve resilience but can hide systemic prompt/schema issues if unbounded.

> **LOCKED.** Repair retry up to 2 times, then surface a node-level error with no state advance.

**Why this, for this assignment**

It handles occasional schema drift while protecting state integrity.

### B6. PDF Ingestion Ceiling

**Question**

What PDF size is supported in v1?

**Options considered**

- No ceiling
- model-window-sized ceiling
- quality/cost ceiling around 50K tokens

**Trade-off**

A higher ceiling uses the large model context window but increases cost and plan dilution.

> **LOCKED.** About 50 pages, 50K tokens, or 200K cleaned characters. Token/character count is the real gate; page count is a soft signal. Reject above the ceiling.

**Why this, for this assignment**

The limit is set by cost and grounding quality, not raw context-window capacity.

### B7. Per-Run Token/Cost Ceiling

**Question**

What aggregate run budget should circuit-break a lesson?

**Options considered**

- No ceiling
- per-node only
- aggregate thread ceiling plus per-node caps

**Trade-off**

Hard ceilings can stop edge-case lessons, but they prevent runaway spend and runaway prompts.

> **LOCKED.** About 1.5M aggregate tokens per thread, with per-node caps around 100K input and 8K output. Circuit-break to a graceful error if exceeded.

**Why this, for this assignment**

It keeps the bounded-workflow promise concrete.

### B8. Model Per Node

**Question**

Which model runs each graph node?

**Options considered**

- One workhorse model for all generative nodes
- heavier model for planning only
- heavier model everywhere

**Trade-off**

A heavier model may improve planning but raises cost; deterministic nodes should not call a model at all.

> **LOCKED.**
>
> - N1 `plan`: `gpt-4o-mini` (`OPENAI_MODEL`) by default; `gpt-4o` (`OPENAI_PLAN_ESCAPE_MODEL`) escape hatch if plan-quality evals demand it.
> - N3 `generate_mcq`: `gpt-4o-mini` (`OPENAI_MODEL`).
> - N5 `assist`: `gpt-4o-mini` (`OPENAI_MODEL`).
> - N9 `summarize`: `gpt-4o-mini` (`OPENAI_MODEL`).
> - N6 `grade`, N7 `feedback`, N8 `advance`: deterministic code, no model.

**Why this, for this assignment**

A capable structured-output workhorse model is enough for v1; only planning may justify a heavier escape hatch.

**Note**

Model-per-node routing is tuning, not architecture. If `gpt-4o` is used for the plan escape hatch, determinism comes from structured JSON output and `temperature: 0`, not from a heavier default model everywhere.

### B9. Prompt Caching

**Question**

Should stable `pdfText` context be cached?

**Options considered**

- No caching
- prompt-cache stable PDF prefix

**Trade-off**

Caching is an optimization and adds provider-specific setup, but the same `pdfText` prefix is reused across plan, MCQ generation, assist, and summary calls.

> **LOCKED.** Treat prompt caching as a recommended tunable optimization, not a product architecture dependency.

**Why this, for this assignment**

It can materially reduce repeated PDF-prefix cost without changing the state model.

---

## 5. Architecture Edits Flagged By These Locks

These are not application-code changes. They are documentation follow-ups implied by the locked decisions.

### `architecture.md`

- `§2` input contract: replace the provisional PDF ceiling note with the locked ingestion ceiling: about 50 pages, 50K tokens, or 200K cleaned characters; reject scanned/empty/oversized PDFs; no OCR in v1.
- `§3` dynamic assist pocket: replace provisional help ceiling with `MAX_HELP = 3`.
- `§6` storage: mark Postgres-only checkpointer as locked and keep Redis trigger conditions.
- `§9` open provisional list: mark the PDF ceiling, quiz shape, scoring rule, difficulty representation, retry/help/objective/cost bounds, and state-storage lock as resolved.

### `agent-architecture.md`

- `Gate 2`: record model-per-node defaults: `gpt-4o-mini` (`OPENAI_MODEL`) for N1/N3/N5/N9, with `gpt-4o` (`OPENAI_PLAN_ESCAPE_MODEL`) as N1 escape hatch only if evals demand it.
- `§5.1`: update `pdfMeta` to `{ filename, charCount, pageCount }`.
- `§5.1`: drop the provisional note on `questions` plus `currentQuestionIndex`; confirm N=3 default, lazy per-objective generation, and durable `questions[]`.
- `§5.1`: clarify `score` as a derived projection from `results[]`, not independently mutated canonical state.
- `§5.1` / `§5.3`: note `approval.note` feeds N1 re-plan when the approval decision is `changes`.
- `§5.3`: confirm no skip/back edges in v1.
- `§5.5` LessonPlan schema: mark `difficulty: "easy" | "medium" | "hard"` as locked.
- `§5.5` MCQ schema: add `sourceQuote: string`.
- `§5.5` ACI rules: extend the assist firewall to exclude `sourceQuote`, alongside `correctIndex`, `explanation`, and `hint`.
- `Gate 6`: update bounded-loop table to `MAX_ATTEMPTS = 3`, `MAX_HELP = 3`, max objectives `<= 8`, repair retries `<= 2`, and per-run ceiling about 1.5M aggregate tokens/thread.
- `Gate 6`: replace optional default grounding self-check with the locked deterministic source-anchor check; keep inline LLM grounding self-check as a deferred escape hatch.
- Open provisional list: mark quiz shape, retry scoring, difficulty, numeric bounds, model routing, and grounding self-check as resolved.

---

## 6. Final Lock Summary

EdPath v1 is a deterministic, PDF-grounded LangGraph teaching workflow.

- It ingests one bounded text-layer PDF
- creates an approved plan
- generates three grounded MCQs per objective lazily
- presents them one at a time
- persists the full graph state through Postgres checkpoints
- and completes with a final performance report

Runtime intelligence is bounded to generative content nodes and the firewalled assist side-channel; control flow, grading, retry behavior, state advancement, and recovery stay deterministic.
