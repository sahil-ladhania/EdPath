# Agent state (`agent/state/`)

Graph state shape, the redacted browser mirror, and update plumbing.

| File | Role |
|------|------|
| `annotation.ts` | `EdPathStateAnnotation` — single source of state shape; internal vs mirrored channels. |
| `to-co-agent-state.ts` | Redacts full state → `CoAgentState`; runs `assertCoAgentFirewall`. |
| `graph-update.ts` | `withCoAgentSnapshot` / `seedGraphState` — merges updates and emits mirror snapshots. |
| `co-agent-output-annotation.ts` | Wire schema — only `coAgentSnapshot` crosses to CopilotKit. |
| `derive-score.ts` | Derives running score from graded attempts. |
| `constants.ts` | Shared limits (repair budget, MCQs per objective, token ceilings, etc.). |
