# edpath-web

The Next.js front end for EdPath — the upload screen, plan approval, the one-at-a-time MCQ widget, the "help me" side-channel, and the summary. It mirrors LangGraph state through CopilotKit CoAgents; it holds no lesson logic of its own (grading, branching, and the interrupt gates all live in the backend graph).

**Don't run this app on its own** — it needs the LangGraph dev server and the Express backend too. See the root [`README.md`](../../README.md) for prerequisites, env setup, and the three processes to start.

Environment variables for this app are documented in [`.env.example`](./.env.example) (copy it to `.env.local`).
