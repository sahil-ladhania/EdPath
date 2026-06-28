# Evaluators (`evals/evaluators/`)

Two tiers: deterministic code checks and optional LLM-as-judge.

## `deterministic/`

Hard pass/fail checks — no API key required.

| File | Dimension |
|------|-----------|
| `plan-grounding.ts` | Plan objectives grounded in PDF text. |
| `source-anchor.ts` | MCQ `sourceQuote` passes anchor check. |
| `assist-leakage.ts` | Assist input/output never leaks answer fields. |
| `end-state.ts` | Final graph state matches expected phase/score. |
| `resume-integrity.ts` | Checkpoint resume preserves seeded state. |

## `llm-judge/`

Soft scoring via LLM when `EVAL_LLM=1` and `OPENAI_API_KEY` is set.

- **Threshold:** 0.8 — scores below fail the dimension.
- **No key:** dimensions soft-pass (skipped, not failed).

Each judge function maps to one eval dimension; bodies are parallel and self-evident.
