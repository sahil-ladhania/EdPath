# Copilot (`copilot/`)

CopilotKit ↔ LangGraph bridge — the seam to the frontend.

| File | Role |
|------|------|
| `runtime.ts` | Registers the EdPath agent with CopilotKit; mounts the Express runtime handler. |
| `edpath-langgraph-agent.ts` | Two overrides on `LangGraphAgent`: (1) merge checkpoint values before run input (preserves `/start` seed on resume); (2) emit redacted `coAgentSnapshot` as `STATE_SNAPSHOT`. |

The frontend never receives full graph state — only the firewalled CoAgent mirror.
