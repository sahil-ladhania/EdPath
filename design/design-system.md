# EdPath — Design System

> Working design system for the EdPath learning agent. Not final — anything here can change. Treat it as the current source of truth for color, type, spacing, and how tokens are consumed.

## The brief, pinned

- **Subject:** a tool that turns one PDF into a guided, sequential lesson.
- **Audience:** a learner mid-study — one screen, one question at a time.
- **The page's single job:** keep that learner inside a focused quiz loop and tell them, unmistakably, whether they got it right.

This is a *focus instrument*, not a marketing page — calm, credible, legible under repetition. The deliberate aesthetic risk is **restraint**: spend all the color energy on the green/red feedback moment and keep everything else quiet.

## Core thesis (the decision that shapes everything)

Because **green/red are functional** (a real acceptance criterion, not styling), the brand color must live nowhere near those hues — otherwise "correct vs incorrect" stops being instantly readable. So:

- The brand is a saturated **indigo-violet**.
- Green/red appear **only** as feedback.

When a panel flashes green, it means something — because nothing else on the screen is green.

## Color palette

Cool **paper** background, not the warm-cream default — a cool neutral makes both indigo and the feedback colors read truer.

| Token | Hex | Role |
|-------|-----|------|
| `--ink` | `#1B1C2A` | Primary text — cool near-black, never pure `#000` |
| `--ink-muted` | `#5A5D72` | Secondary text, captions, labels |
| `--paper` | `#F5F6FA` | App background (cool near-white) |
| `--surface` | `#FFFFFF` | Cards, the MCQ widget, panels |
| `--border` | `#E4E6EF` | Hairlines, dividers, input outlines |
| `--primary` | `#4633D9` | Brand indigo — buttons, active rail, focus rings |
| `--primary-strong` | `#3526B0` | Hover / pressed |
| `--primary-soft` | `#ECEAFB` | Active/selected fills, eyebrow tints |

### Semantic — reserved, functional

| Token | Hex | Role |
|-------|-----|------|
| `--success` | `#15A05A` | Correct: border + icon |
| `--success-soft` | `#E5F6EC` | Correct: panel/option fill |
| `--success-ink` | `#11703F` | Correct: text on soft |
| `--error` | `#E0413E` | Incorrect: border + icon |
| `--error-soft` | `#FCEBEA` | Incorrect: panel/option fill |
| `--error-ink` | `#A52723` | Incorrect: text on soft |

The green/red are intentionally **conventional and high-contrast** — you don't take aesthetic risks with accessibility-critical signals. All three pairs target WCAG AA for their use (ink-on-soft for text, base for borders/icons).

## Typography

A characterful display against a quiet, hyper-legible body — *not* the Geist default the scaffold ships with.

| Role | Face | Notes |
|------|------|-------|
| Display / headings | **Bricolage Grotesque** | Contemporary grotesque with real personality, used with restraint. Variable, free via `next/font/google`. |
| Body / UI | **Inter** | The quiet partner — built for dense UI and small sizes; carries question text and choices. |
| Data / numerals | **Geist Mono** | Already wired in the scaffold — reuse for scores/percentages in the report. No third font load. |

### Type scale

Base 16px, ~1.25 major-third — calm for reading-heavy UI.

| Token | px | Use |
|-------|----|----|
| `xs` | 12 | Eyebrows, captions (uppercase, `+0.08em` tracking) |
| `sm` | 14 | Labels, helper text |
| `base` | 16 | Body, MCQ options |
| `lg` | 18 | Question text |
| `xl` | 20 | Card titles |
| `2xl` | 24 | Section headings |
| `3xl` | 30 | Page / objective titles |
| `4xl` | 36 | Display (hero, final report) — Bricolage, `-0.02em`, line-height 1.1 |

**Weights:** Bricolage 600/700; Inter 400 body, 500/600 UI labels.
**Line-height:** 1.6 prose · 1.5 UI · 1.1 display.

## Spacing & radius

4px base scale — tokens `space-1` … `space-8`:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

**Radius:**

| Token | px | Use |
|-------|----|----|
| `--radius-sm` | 8 | Inputs, radios container |
| `--radius-md` | 12 | Cards, widgets |
| `--radius-lg` | 16 | Main lesson panel |

Moderate radius on purpose — neither the zero-radius broadsheet nor pill-everything.

## Signature element

A persistent **objective rail** down the left of the lesson: the learning objectives as a vertical, numbered spine — completed ones marked, the current one filled with `--primary`, upcoming ones in `--ink-muted`.

- Numbering is justified because the objectives **are** a real ordered sequence.
- The rail reflects the same checkpointed progress state we already track — distinctive, functional, and nearly free.
- It ties the product's identity directly to its core concept: a *path*.

## How tokens live and how web consumes them

Web is **Tailwind v4 (CSS-first `@theme`)**, so the cleanest path is one CSS file as the single source of truth:

- `packages/tokens/tokens.css` declares all tokens as `:root { --ink: …; --primary: …; }`, then maps them into Tailwind via `@theme inline { --color-primary: var(--primary); --font-display: …; }`.
- `apps/edpath-web/app/globals.css` does `@import "@repo/tokens/tokens.css";` — one line. That single import gives web **both** the CSS variables (raw `var(--primary)` use, e.g. dynamic feedback states) **and** Tailwind utility classes (`bg-primary`, `text-success-ink`, `font-display`).

**Why:** in Tailwind v4 the `@theme` block generates utilities *and* CSS variables from the same declarations — one source of truth, zero JS config, utilities and runtime variables can't drift. `@repo/ui` primitives import the same file, so app and shared components share one palette.
