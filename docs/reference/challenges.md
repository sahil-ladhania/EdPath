# Challenges & High-Risk Parts

The genuinely hard parts of **this specific** assignment — the things to be careful about across the whole build. Specific to EdPath, not generic engineering advice. No sugarcoating.

## At a glance

| # | Challenge | Core risk | Why it's high-risk |
|---|-----------|-----------|--------------------|
| 1 | True HITL interrupt via LangGraph + CopilotKit | Faking the pause; losing the checkpointed state on refresh | The single most-probed piece. Reviewers will reload/kill the tab and expect the pause to hold. |
| 2 | "Help without giving away the answer" side-channel | Two control flows fighting; answer leakage | A deterministic quiz loop vs. an open free-text assist turn, plus a real guardrail problem. |
| 3 | Grounding MCQs strictly in the PDF (no RAG) | Hallucinated facts; topic drift; context-window pressure | "Generated directly from the PDF content" is an acceptance criterion. Messy PDF extraction compounds it. |
| 4 | Structured output reliability for genUI | Malformed / shape-drifting LLM output breaks the widget | Plan, MCQ widget, and final report all render from LLM-produced structured data. |
| 5 | State/checkpointer as single source of truth | Ad-hoc client state instead of checkpointed graph state | Breaks resumption and produces a wrong final report. "Retry without penalty" is easy to get subtly wrong. |

---

## 1. The HITL interrupt must be a true LangGraph `interrupt`, surfaced through CopilotKit — and survive a refresh

This is the single most-probed piece.

- The graph genuinely **pauses mid-execution**, the plan is shown in the UI, and execution **resumes from the same checkpointed state** on approval.
- **Risk:** faking it — generating everything first, then showing a confirm dialog — or losing the paused state because the thread/checkpoint wiring isn't solid.
- **What reviewers will do:** reload the page or kill the tab and expect the pause to hold.

## 2. The "help me without giving away the answer" side-channel inside a deterministic loop

This is the subtle one.

- The main flow is deterministic, but mid-quiz the user can free-text "explain this topic" or "give me a hint."
- The agent must:
  - answer helpfully,
  - **never leak the correct option**, and
  - **steer back to the question**.
- **Risk:** two control flows fighting each other — the deterministic quiz loop vs. an open chat turn — plus a real prompt-engineering / guardrail problem to stop answer leakage.
- Needs deliberate design of how a free-form assist turn coexists with the structured node **without becoming the "autonomous agent" we're told not to build**.

## 3. Grounding MCQs (and hints/explanations) strictly in the PDF

"Generated directly from the PDF content" is an acceptance criterion.

- Without RAG, the whole cleaned text rides in the prompt. Risks:
  - the model inventing facts **not in the PDF**,
  - questions drifting to **general knowledge**, and
  - **context-window pressure** on a large PDF — the one documented escape hatch.
- **Also:** reliable PDF text extraction is genuinely messy — columns, tables, scanned/image PDFs with no text layer. Clean, faithful extraction is a real failure point.

## 4. Structured output reliability for genUI rendering

Every MCQ widget, the plan todo list, and the final report are rendered from **LLM-produced structured data** (question, options, correct index, explanation, hint).

- **Risk:** if the model returns malformed or shape-drifting output, the widget breaks.
- This is where the shared **Zod schemas** earn their place: one contract validated on the backend before it ever reaches the React widget.

## 5. State/checkpointer as the single source of truth across the loop, with retry having "no penalty"

- Progress (current objective, current question, attempts, score) must live in **checkpointed graph state** so the summary at the end is accurate and the flow is resumable.
- **"Retry without penalty"** means scoring logic must distinguish *eventually correct* from *correct first try* (or simply not penalize retries) — easy to get subtly wrong.
- **Risk:** leaning on ad-hoc client state instead of the checkpointer, which then breaks resumption and produces a wrong final report.
