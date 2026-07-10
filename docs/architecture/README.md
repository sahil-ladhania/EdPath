# docs/architecture

Code-level architecture notes that fill in **as the build progresses**. This folder does **not** restate the system design — that is locked in the root docs.

**Canonical (read these first):**

- System architecture, components, data flow, boundaries, storage → [`../reference/architecture.md`](../reference/architecture.md)
- Agent/graph design (nodes, edges, interrupts, state object, schemas, reliability) → [`../reference/agent-architecture.md`](../reference/agent-architecture.md)

**What lives here:**

- [`repo-map.md`](./repo-map.md) — where things actually live in the code (entrypoints, env handling, checkpointer wiring, external APIs, build/test scripts). The end-to-end codebase map.
- [`system-overview.md`](./system-overview.md) — pointer only; the real overview is `../../architecture.md`.

Keep entries here as pointers and code-level maps — never copies of the root design docs.
