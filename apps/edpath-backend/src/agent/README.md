# Agent (`agent/`)

Owns the deterministic LangGraph teaching workflow: **Plan → Approve → Quiz loop → Summarize**. The LLM fills content only at generative nodes; control flow, branching, grading, and interrupts are engineering-owned.

## Node map

| Id | Graph name | File | One-line role |
|----|------------|------|---------------|
| N1 | `plan_lesson` | `nodes/plan.ts` | LLM drafts a PDF-grounded lesson plan. |
| N2 | `approval_gate` | `nodes/approval-gate.ts` | HITL interrupt — user approves or requests changes. |
| N3 | `generate_mcq` | `nodes/generate-mcq.ts` | LLM generates MCQs; source-anchor gate + repair budget. |
| N4 | `await_input` | `nodes/await-input.ts` | Interrupt — wait for answer, help, or advance signal. |
| N5 | `assist` | `nodes/assist.ts` | Help side-channel (firewalled — never sees the answer). |
| N6 | `grade` | `nodes/grade.ts` | Deterministic grader — no LLM. |
| N7 | `assemble_feedback` | `nodes/feedback.ts` | Assembles green/red feedback payload for the widget. |
| N8 | `advance` | `nodes/advance.ts` | Advances question/objective index or routes to summarize. |
| N9 | `summarize` | `nodes/summarize.ts` | End-of-lesson summary and study tips. |

Wiring and conditional edges live in `graph.ts` (`routeAfter*` functions).

## Subfolders

| Folder | Contents |
|--------|----------|
| `nodes/` | One file per graph node (N1–N9). |
| `lib/` | Standalone helpers: source-anchor, grading, assist firewall, structured LLM generate, LLM client. See `lib/README.md`. |
| `state/` | State schema, CoAgent mirror + firewall, score derivation, graph-update plumbing. See `state/README.md`. |
| `types/` | Agent-local contracts (never cross an HTTP boundary). See `types/README.md`. |
| `prompts/` | System/user prompt templates for generative nodes. |
| `__fixtures__/` | Vitest fixtures (stub PDF text, stub plan/MCQ responses). Underscored — test-adjacent convention. |

## Three invariants (be conservative — control flow is intentional)

1. **Interrupt gates** — `approval_gate` (N2) and `await_input` (N4) pause the graph for HITL; resume kinds drive routing.
2. **Source-anchor grounding** — `generate_mcq` (N3) validates `sourceQuote` via `lib/source-anchor.ts` against `pdfText`.
3. **Assist firewall** — `lib/assist-input.ts` + `state/to-co-agent-state.ts` ensure help never receives `correctIndex`, `explanation`, `hint`, or `sourceQuote`.

## Deferred cleanup

These exports have zero callers today but are kept intentionally for now:

- `generatePlanFromPdf` (`nodes/plan.ts`) — exposed for tests, unused.
- `getDefaultModel` / `getPlanEscapeModel` (`lib/llm/client.ts`) — superseded by `getPlanModel`.
