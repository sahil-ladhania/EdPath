# Evals (`evals/`)

Offline quality/safety harness over the teaching workflow. Replays scripted scenarios against a fresh in-process graph and checks four dimensions:

| Dimension | What it checks |
|-----------|----------------|
| `plan_grounded` | Lesson plan derives from PDF content. |
| `mcqs_grounded` | MCQs and source quotes anchor to `pdfText`. |
| `feedback_behavior` | Green/red feedback, hints, assist firewall. |
| `loop_state` | Score consistency, resume integrity, end state. |

## How to run

```bash
# Deterministic only (stub tier, no API key)
npm run eval --workspace=apps/edpath-backend

# With LLM judge (requires OPENAI_API_KEY)
EVAL_LLM=1 npm run eval --workspace=apps/edpath-backend

# Filter cases by substring
EVAL_FILTER=happy npm run eval --workspace=apps/edpath-backend
```

## Pipeline

```
run.ts
  → run-suite.ts (filter cases, aggregate results)
      → run-scenario.ts (replay EvalScript step-by-step)
      → evaluate-case.ts (deterministic checks + optional LLM judge)
```

## Subfolders

| Folder | Contents |
|--------|----------|
| `scenarios/` | Eval case definitions (`EvalScript` + metadata). |
| `fixtures/` | PDF bytes and adversarial prompts. Plain `fixtures/` — eval data, not Vitest `__fixtures__`. |
| `evaluators/deterministic/` | Code checks (grounding, firewall, score, resume). See `evaluators/README.md`. |
| `evaluators/llm-judge/` | Soft 0.8-threshold LLM scores; no-op without API key. |
| `sync-langsmith-dataset.ts` | Push cases to LangSmith dataset. |

## Deferred cleanup

- `getEvalCaseById` (`scenarios/index.ts`) — exported, zero callers; kept for now.
