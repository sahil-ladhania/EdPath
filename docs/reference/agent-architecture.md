# EdPath — Agent Architecture (the gate walk)

> Companion document: [`architecture.md`](./architecture.md) (system architecture).
> Methodology: the Agent Engineering Handbook — Gates 0→6, *start with the simplest thing that meets today's requirement; climb only when a requirement demonstrably forces it.*
> Source of truth: [`assignment.md`](./assignment.md) · risk register: [`challenges.md`](./challenges.md).
>
> `PROVISIONAL:` tags mark simplest-default positions, not locks. The ~30 product decisions belong to a separate session producing `design-decisions.md`.

---

## Gate 0 — The contract (agent level)

The agent is the **LangGraph workflow**. (The system-level contract is in `architecture.md §2`.)

### Input
- **`pdfText`** — cleaned full text of the PDF (extraction happens upstream of the graph). The graph's grounding source.
- **`threadId`** — the checkpointer thread that makes the run durable/resumable.
- **Resume values** delivered into a paused graph: the approval decision; the selected answer index; free-text help messages.

### Output (contract level; full Zod in §Gate 5)
Four validated structured artifacts, each conforming to a shared schema in `packages/schemas`, plus a terminal end-state:

| Artifact | Shape (high level) | Purpose |
|---|---|---|
| **LessonPlan** | ordered `{ objectiveId, title, description, difficulty }` | the todo list shown for approval |
| **MCQ** | `{ question, options[], correctIndex, explanation, hint }` | renders the widget + drives the branch |
| **Feedback** | `{ verdict, highlightIndex, explanation?, hint?, canRetry }` | green/red after a submit |
| **Summary** | `{ perObjective[], overall, studyTips[] }` | the final report |

The **end-state** holds completed objectives, per-question attempts, retry-aware score, and the summary — the thing evals assert on.

### Success criteria (end-state, not per-step)
- **Grounding:** plan + every MCQ derivable from `pdfText` (no invented facts).
- **Branch correctness:** correct → explanation + advance; incorrect → hint + retry, attempts incremented, **score not penalized for retries**.
- **No leakage:** across all help turns, `correctIndex` is never revealed; the model returns to the active question.
- **Completion:** the loop visits every planned objective once and reaches the summary node.
- **Schema validity:** every artifact passes its Zod schema before leaving the backend.

### Non-goals
Not an autonomous agent (the LLM does not choose control flow); no multi-PDF, no RAG, no multi-user, no bespoke persistence schema (checkpointer first).

---

## Gate 1 — Workflow vs. agent

**EdPath is a workflow** — deterministic, engineer-controlled, with one bounded dynamic pocket. The whole path is drawable up front (the assignment's numbered flow); only content and (bounded) iteration count vary. The LLM never decides the next step.

Choosing an autonomous agent would trade latency, cost, and a large failure surface for flexibility the task does not want, and would fight every item in `challenges.md`. See the end-to-end control-flow diagram and the bounded-assist analysis in `architecture.md §3`; the node/edge detail is in **Gate 5** below.

---

## Gate 2 — The atomic unit (augmented LLM)

One augmented LLM, invoked at four generative nodes (plan, MCQ, assist, summarize). Same backbone, tailored context per node.

- **Model:** Claude, current generation. Default workhorse **`claude-sonnet-4-6`**; **`claude-opus-4-8`** available for the heavier plan reasoning if quality demands. `PROVISIONAL: confirm in design-decisions session` — model-per-node and any cost routing is tuning, not architecture. Architecture requires only "a capable, structured-output-reliable Claude model."
- **Context per call (high-signal only):** a node-specific **system prompt** (role + job + guardrails, at the right altitude); **`pdfText`** (grounding — this is our "retrieval" minus a vector store); and a **minimal slice of state** (e.g. MCQ node → current objective; assist → current question *without* `correctIndex`; summary → results).
- **Memory:** lives in the **LangGraph state object (checkpointed)**, not in the model and not in a bespoke store. The state *is* the memory — this is what makes refresh-survival (Challenge #1) and state-as-source-of-truth (Challenge #5) solvable.
- **Tools:** the **LLM calls essentially none.** The only deterministic operation — grading — is plain code the graph calls (N6), never a model-chosen tool. The atomic unit is *"LLM + grounding context + state-as-memory + structured output"* with the tools dimension deliberately empty. Simplest possible unit, and enough.

---

## Gate 3 — Lowest pattern on the ladder

**Chosen: prompt chaining (rung 2)** — fixed sequential steps with programmatic gates between them — **plus two non-ladder workflow constructs:** a **bounded loop** (per-objective / retry) and a **human interrupt** (approval). Assist is a single LLM call (rung 1) hung off the loop.

| Rung | Pattern | Used? | Why / why not |
|---|---|---|---|
| 1 | Single LLM call | sub-part | Assist + each generative node are individually single calls. |
| **2** | **Prompt chaining** | **✅** | Flow decomposes cleanly into fixed steps with a programmatic gate between each (schema validation; deterministic grader). Trades latency for accuracy — the textbook fit. |
| 3 | Routing | ❌ | Branches are deterministic conditionals over state, not LLM classification into handlers. |
| 4 | Parallelization | ❌ (opt.) | Objectives are taught sequentially; one learner, one question at a time. Pre-generating MCQs in parallel is a latency-only optimization. `PROVISIONAL`. |
| 5 | Orchestrator–workers | ❌ | Subtasks are known ahead (the plan is data); nothing decided at runtime by a delegating orchestrator. |
| 6 | Evaluator–optimizer | ❌ (opt.) | No generate→critique→refine loop required. An optional MCQ-grounding self-check could borrow this shape as a guardrail. `PROVISIONAL`. |
| 7 | Autonomous agent | ❌ | Ruled out in Gate 1. |

The **bounded loop** (objectives + retries) is required by AC7/AC8; the **human interrupt** (approval) by AC3. Both are constructs in *our* control flow, not climbing the ladder. No rung above prompt chaining buys anything the assignment demands.

---

## Gate 4 — Single vs. multi-agent (cost gate)

**Single agent — one workflow, one shared state.** Multi-agent must clear both bars (independent parallel threads AND value justifying ~15× tokens); EdPath clears neither: the flow is sequential and shares one state across all nodes, and it's a single-user session over one bounded PDF. The four generative nodes are the *same* augmented LLM at different steps, not four agents. Multi-agent here is over-engineering.

---

## Gate 5 — The graph design + ACI

### 5.1 State object (single source of truth; the agent's memory)

| Field | Type (contract level) | Purpose |
|---|---|---|
| **`pdfText`** | `string` | grounding source for every generative node |
| `pdfMeta` | `{ filename, charCount }` | provenance (optional) |
| **`plan`** | `LessonPlan \| null` | approved objective list |
| **`approval`** | `{ decision: "approve"\|"changes", note? } \| null` | HITL outcome; `changes` re-plans |
| **`currentObjectiveIndex`** | `number` | outer-loop pointer |
| **`questions`** | `MCQ[]` | MCQ(s) for the current objective |
| **`currentQuestionIndex`** | `number` | inner-loop pointer |
| **`selectedIndex`** | `number \| null` | submitted option (this attempt) |
| **`attempts`** | `number` | attempts on current question (retry + scoring) |
| **`helpTurnsUsed`** | `number` | bounds the dynamic pocket |
| **`results`** | `ObjectiveResult[]` | `{ objectiveId, questionId, correct, attempts, firstTryCorrect }` |
| **`score`** | `{ correct, total, firstTry }` | retry-aware aggregate (derived from `results`) |
| **`summary`** | `Summary \| null` | final report |
| **`messages`** | `Message[]` | chat history (CopilotKit + assist context) |
| **`phase`** | `"planning"\|"awaiting_approval"\|"quizzing"\|"awaiting_input"\|"complete"` | lets the UI re-render the right surface after refresh |
| `lastError` | `{ node, kind, detail } \| null` | reliability/recovery |

**`PROVISIONAL: confirm in design-decisions session` fields:**
- **`questions` (list) + `currentQuestionIndex`** assume *N MCQs per objective*; if the lock is one-per-objective, this collapses to a single `currentQuestion` and the inner loop disappears.
- **`score` / `firstTryCorrect`** encode the "retry without penalty" rule (default: retries never reduce score; `firstTry` tracked for the summary).
- **`difficulty`** representation in `LessonPlan`.

### 5.2 Nodes

| # | Node | Purpose | LLM? |
|---|---|---|---|
| N1 | `plan` | from `pdfText`, produce `LessonPlan` | ✅ |
| N2 | `approval_gate` | **interrupt**: surface plan, await decision | ⏸ |
| N3 | `generate_mcq` | produce grounded `MCQ[]` for current objective | ✅ |
| N4 | `await_input` | **interrupt**: pause for answer submit OR help message | ⏸ |
| N5 | `assist` | guarded single call: help, no `correctIndex`, steer back; `helpTurnsUsed++` | ✅ |
| N6 | `grade` | **deterministic code**: compare indices, retry-aware; update `attempts`/`results`/`score` | ❌ |
| N7 | `feedback` | surface green+explanation or red+hint from the validated MCQ | ❌ |
| N8 | `advance` | move pointers (next question → next objective), reset per-question counters | ❌ |
| N9 | `summarize` | from `results`/`score`, produce `Summary` | ✅ |

N6/N7 are code, not LLM: grading never touches a model, and feedback text was generated *with* the question (one validated artifact). This is why leakage in N5 cannot corrupt scoring, and hints/explanations stay grounded.

### 5.3 Edges & branches

```
START ─► N1 plan ─► N2 approval_gate ⏸
        N2 ─[changes]─► N1
        N2 ─[approve]─► N3 generate_mcq ─► N4 await_input ⏸
        N4 ─[help]───► N5 assist ─► N4               (bounded by helpTurnsUsed)
        N4 ─[answer]─► N6 grade ─► N7 feedback
        N7 ─[incorrect]─► N4                         (RETRY, no penalty)
        N7 ─[correct]──► N8 advance
        N8 ─[more questions in objective]─► N4
        N8 ─[objective done, more objectives]─► N3
        N8 ─[all done]─► N9 summarize ─► END
```

Every branch is a **deterministic conditional over state**: `approval_gate` reads `approval.decision`; `await_input` split is a deterministic check on the resume payload's *kind* (widget answer vs. free text), not LLM routing; `feedback` reads the grade verdict; `advance` compares indices against lengths. The `incorrect → await_input` edge delivers AC7 (same question, `attempts++`, score untouched).

### 5.4 Interrupts & resume

**Two interrupts, both checkpointer-backed** so state is durable at every pause (Challenge #1):
1. **`approval_gate` (N2)** — the mandatory HITL (AC3). `interrupt(plan)` persists state keyed by `threadId` and halts; nothing downstream runs until resumed.
2. **`await_input` (N4)** — the per-question pause; same mechanism, so a mid-quiz reload holds.

**Resume (conceptual):** the client sends a resume command (`Command(resume = payload)`) for the thread; LangGraph reloads the checkpoint for `threadId`, injects `payload` as the `interrupt()` return value, and continues *from that node* (not a restart). Approval payload → `approval`; await_input payload → either `selectedIndex` (→ grade) or a help message (→ assist). **On refresh:** the frontend re-attaches to `threadId`, the checkpointer rehydrates state, and `phase` tells the UI which surface to re-render. No client-held progress — graph state is authoritative.

### 5.5 Gate 5 — ACI: structured-output contracts (full Zod at build, in `packages/schemas`)

The ACI is **almost entirely these four contracts** — the model's action space is *"return a valid artifact of shape X,"* validated on the backend **before** it reaches state or the widget (Challenge #4).

**A. LessonPlan**
```
LessonPlan { objectives: Objective[] }                       // ordered todo list
Objective  { objectiveId: string
             title: string
             description: string                             // grounded in PDF
             difficulty: "easy"|"medium"|"hard" }            // PROVISIONAL representation
```

**B. MCQ**
```
MCQ { questionId: string
      objectiveId: string                                    // trace back to plan
      question: string
      options: string[]                                      // >= 2; rendered as radios
      correctIndex: number                                   // NEVER placed in assist context
      explanation: string                                    // shown on correct (AC6), grounded
      hint: string }                                         // shown on incorrect (AC7), no answer reveal
```

**C. Feedback** (assembled in N7 from MCQ + grade — not a fresh LLM artifact)
```
Feedback { verdict: "correct"|"incorrect"
           highlightIndex: number                            // submitted option, for green/red
           correctIndex?: number                             // ONLY when verdict==="correct"
           explanation?: string                              // when correct
           hint?: string                                     // when incorrect
           canRetry: boolean }                               // true when incorrect
```

**D. Summary**
```
Summary { perObjective: { objectiveId, title, correct, total, firstTryRate }[]
          overall: { correct, total, firstTryRate }
          studyTips: string[] }                              // personalized, grounded in weak objectives
```

**Assist (N5)** returns a plain chat message — no structured artifact — so it stays a single bounded call and can't drive UI state.

**ACI rules (poka-yoke):**
- `correctIndex` is **structurally firewalled** — present in `MCQ` for the grader, never in assist context, omitted from `Feedback` until correct. Leakage is prevented by *what each call can see*, not by hoping the prompt holds.
- Answers are **integer indices, not free text** — grading can't misparse.
- Stable IDs (`objectiveId`, `questionId`) thread plan → questions → results → summary.

**The one genuine function** (called by the graph in N6, not the model):
```
name:    gradeAnswer
when:    invoked by N6 after an answer submit (never by the LLM)
input:   { selectedIndex: number, mcq: MCQ, priorAttempts: number }
output:  { verdict: "correct"|"incorrect",
           firstTryCorrect: boolean,        // correct && priorAttempts === 0
           attempts: number }               // priorAttempts + 1
failure: selectedIndex out of range → throw GradingError
         → N6 re-surfaces the same question; no state mutation, no score change
```
No other tools. No retrieval tool (PDF is in-context), no web/DB tool. An empty model-facing tool set removes the #1 failure mode (ambiguous tool choice) entirely.

---

## Gate 6 — Reliability spine

### Bounded loops
| Bound | Limit | Behavior at limit |
|---|---|---|
| Max retries / question | `MAX_ATTEMPTS` (`PROVISIONAL`, e.g. 5) | reveal explanation, mark not-first-try, advance |
| Max help turns / question | `MAX_HELP` (`PROVISIONAL`, e.g. 3) | assist firmly steers back, declines tangents |
| Max objectives / questions | from `plan`, hard-capped (`PROVISIONAL`, e.g. ≤ 10) | stops runaway plans on huge PDFs |
| Per-run cost / iteration ceiling | token/step budget per thread | circuit-break → graceful error surface |

### Failure points → recovery
| Failure | Where | Recovery |
|---|---|---|
| PDF parse fails (scanned/empty) | upstream extraction | reject at upload with a clear message; graph never starts on empty `pdfText` (Challenge #3) |
| Invalid JSON / schema drift | N1, N3, N5, N9 | backend Zod catch → **bounded node retry** (e.g. ≤2, with a repair nudge) → else node-level error, **no state advance** (Challenge #4) |
| Valid but ungrounded MCQ | N3 | optional grounding self-check (`PROVISIONAL`); default: caught by evals |
| Grading error (bad index) | N6 | `GradingError` → re-surface same question, no mutation |
| Interrupt/resume desync (refresh) | N2, N4 | checkpointer authoritative; rehydrate from `threadId`, re-render from `phase` (Challenge #1) |
| One step derails trajectory | general | durable execution + resume-from-checkpoint (not restart) |

### Tracing
**LangSmith from day one** — every node, LLM call, and interrupt/resume traced, tied to `threadId`. Non-determinism at generative nodes makes tracing the only reliable root-cause path.

### Human checkpoint
**One mandatory checkpoint: `approval_gate` (N2)** — the plan is reviewed before any teaching (AC3), placed exactly where the session's commitment begins. The per-question `await_input` pauses are interaction points, not approval gates.

### Evals (~20 real cases, end-state — not per-step)
Use a handful of real PDFs (easy / dense / messy). Evaluate the **final state**, since agents reach goals by different valid paths.

**Four dimensions (LLM-as-judge + deterministic checks):**
1. **Plan grounded** — every objective supported by `pdfText`. *(judge 0–1)*
2. **MCQs grounded** — content traces to the PDF, not general knowledge (AC4). *(judge)*
3. **Feedback behaves** — correct→explanation, incorrect→hint+retry; **no help turn leaked `correctIndex`** (Challenge #2). *(deterministic + judge on assist transcripts)*
4. **Loop completes & state correct** — reaches `summarize` for every objective; `score` retry-aware and consistent with `results`; summary reflects true progress (Challenge #5). *(deterministic on end-state)*

**~20 cases (`PROVISIONAL` mix):** ~12 happy-path across PDFs; ~4 adversarial help turns probing leakage; ~2 messy/edge PDFs; ~2 resume-after-refresh integrity checks. Plus a judge rubric (factual accuracy, grounding, completeness, no-leakage) and **human spot-eval** for subtle leakage / weird-PDF hallucination.

---

## Open `PROVISIONAL` items (for `design-decisions.md`)
- Quiz shape: N MCQs per objective vs. one (drives `questions` list vs. single `currentQuestion`).
- Scoring rule for "retry without penalty."
- Difficulty representation.
- Retry cap, help-turn cap, max objectives, per-run cost ceiling.
- Model-per-node / cost routing.
- Optional MCQ-grounding self-check (evaluator-optimizer guardrail).
- Optional parallel MCQ pre-generation (latency).
