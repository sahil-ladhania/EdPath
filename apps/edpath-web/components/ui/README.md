# components/ui/

## Purpose

Shared presentational primitives used across landing, plan, quiz, summary, and shell. Mix of shadcn/ui base components and EdPath-specific wrappers — styling only, no lesson logic.

## Contents

**EdPath-specific**

- **`Panel.tsx`** — Card container with consistent padding, border, and size variants.
- **`Icon.tsx`** — Lucide icon wrapper with size and color variants.
- **`GeneratingState.tsx`** — Spinner + message/subtext for in-flight generation.
- **`GeneratingPanel.tsx`** — `GeneratingState` wrapped in `Panel` (used by `LessonRunner` loaders).

**shadcn/ui primitives**

- **`button.tsx`**, **`card.tsx`**, **`dialog.tsx`**, **`input.tsx`**, **`radio-group.tsx`**, **`separator.tsx`**, **`textarea.tsx`**, **`badge.tsx`** — Standard Radix-based UI building blocks.

## How it fits

- **Depends on:** [`lib/utils.ts`](../../lib/utils.ts) (`cn()`), Tailwind, `class-variance-authority`, Radix UI.
- **Consumed by:** all feature folders under [`components/`](../).
- **Not consumed by:** [`hooks/`](../hooks/), [`lib/`](../lib/), or [`api/`](../../api/) — UI layer only.

## Reading tips

- Prefer **`Panel`** over raw `card` for lesson surfaces — it carries EdPath elevation and spacing tokens.
- shadcn components are configured via [`components.json`](../../components.json) at the app root.
