# docs/handoff

End-of-session state so the **next** session resumes cheaply instead of re-deriving context. Updated at the end of a working session; do not fabricate.

- [`current.md`](./current.md) holds the latest handoff — overwrite it each session so it always reflects the current state.
- Suggested format (keep it compact):
  - **What changed** this session
  - **What's unfinished** / next step
  - **What's risky** or in-progress
  - **Command that proves success** (build / test / run)
  - **What not to touch** (and why)

Goal: a cold session can read this one file plus the relevant deep doc and pick up immediately.
