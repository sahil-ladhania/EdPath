# EdPath

AI learning agent that turns a PDF into an interactive, HITL-approved MCQ lesson.

**Stack:** TypeScript · LangGraph · CopilotKit · Next.js · Express · PostgreSQL · Redis

## What it does

Upload a PDF, the agent drafts a lesson plan (objectives and difficulty), you approve it, then it quizzes you objective by objective with MCQs in a custom widget. Correct answers get an explanation, wrong answers get a hint and a retry. Ends with a progress report and study tips.

## Documentation

The full design lives in [`docs/reference/`](./docs/reference/). Read the one that fits your task (see the doc map in [`AGENTS.md`](./AGENTS.md)):

- [`assignment.md`](./docs/reference/assignment.md) — the contract / acceptance criteria
- [`architecture.md`](./docs/reference/architecture.md) — system architecture, components, data flow
- [`agent-architecture.md`](./docs/reference/agent-architecture.md) — the LangGraph agent: nodes, interrupts, state, schemas
- [`design-decisions.md`](./docs/reference/design-decisions.md) — locked product/design decisions
- [`db-schema.md`](./docs/reference/db-schema.md) — persistence (checkpointer-only; why there are no app tables)
- [`feature-flow.md`](./docs/reference/feature-flow.md) — user flow, feature breakdown, AC → feature mapping
- [`challenges.md`](./docs/reference/challenges.md) — the genuinely hard parts / risk register

Working notes that fill in during the build: [`docs/handoff/`](./docs/handoff/) · [`docs/bugs/`](./docs/bugs/) · [`docs/decisions/`](./docs/decisions/) · [`docs/architecture/`](./docs/architecture/).

## Status

Work in progress.