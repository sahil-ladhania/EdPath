# Agent types (`agent/types/`)

Agent-local contracts that never cross an HTTP or package boundary (shared artifacts live in `@repo/schemas` / `@repo/types`).

| File | Contract |
|------|----------|
| `assist.types.ts` | Assist side-channel input/output shapes. |
| `grade-answer.types.ts` | Deterministic grader input/output. |
| `interrupt.types.ts` | HITL interrupt payloads (approval, await-input). |
| `message.types.ts` | Help-thread message shapes for the assist node. |
