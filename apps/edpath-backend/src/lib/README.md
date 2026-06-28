# App lib (`src/lib/`)

Cross-feature infrastructure — **not** agent-specific. Do not confuse with `agent/lib/` (graph node helpers).

| Path | Role |
|------|------|
| `langgraph/deployment-client.ts` | Seeds a lesson thread on the LangGraph deployment; idempotent create + guard against double-seed. |

If this folder grows, keep app-wide clients here; keep graph-node pure helpers in `agent/lib/`.
