# edpath-web

The Next.js front end for EdPath — the upload screen, plan approval, the one-at-a-time MCQ widget, the "help me" side-channel, and the summary. It mirrors LangGraph state through CopilotKit CoAgents; it holds no lesson logic of its own (grading, branching, and the interrupt gates all live in the backend graph).

**Don't run this app on its own** — it needs the LangGraph dev server and the Express backend too. See the root [`README.md`](../../README.md) for prerequisites, env setup, and the three processes to start.

Environment variables for this app are documented in [`.env.example`](./.env.example) (copy it to `.env.local`).

## Folder map

| Folder | Role | README |
|--------|------|--------|
| [`app/`](./app/) | Next.js routes and root layout | [app/README.md](./app/README.md) |
| [`api/`](./api/) | REST clients for upload + lesson start | [api/README.md](./api/README.md) |
| [`components/`](./components/) | Feature UI (plan, quiz, summary, shell, etc.) | [components/README.md](./components/README.md) |
| [`hooks/`](./hooks/) | Client UX hooks on mirrored agent state | [hooks/README.md](./hooks/README.md) |
| [`lib/`](./lib/) | Pure helpers (phase resolution, interrupts, thread IDs) | [lib/README.md](./lib/README.md) |
| [`types/`](./types/) | App-local TypeScript contracts | [types/README.md](./types/README.md) |

## Lesson flow (high level)

1. **Upload** — User picks a PDF on `/`. `POST /upload` validates it; `POST /start` seeds a new thread and navigates to `/lesson/[threadId]`.
2. **CoAgent connect** — `EdPathCopilotProvider` binds CopilotKit to the thread. `useCoAgentLesson` (in `components/shell/`) mirrors LangGraph state and resolves HITL interrupts.
3. **Plan → Approve** — Graph generates a plan; UI shows `PlanWidget` at the approval interrupt. User approves or requests revision.
4. **Quiz loop** — One MCQ at a time via `McqWidget`. User selects answers, gets green/red feedback, can retry or use the help side-channel. Intents go back through interrupt resolution — grading is server-side code.
5. **Summary** — When the graph reaches `phase: "complete"`, `SummaryView` shows score, per-objective results, and study tips.

Phase visibility and loader copy are resolved in [`lib/phase-ui.ts`](./lib/phase-ui.ts) and wired by [`components/shell/LessonRunner.tsx`](./components/shell/LessonRunner.tsx).

**Note:** The CoAgent bridge hook is `components/shell/useCoAgentLesson.tsx` — not in `hooks/`. `hooks/` holds UX-layer hooks (`useCoAgentQuiz`, `usePlanRevision`) that sit on top of the mirrored state.
