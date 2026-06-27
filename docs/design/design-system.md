# EdPath — Design System

> Working design system for the EdPath learning agent. Not final — anything here can change. Treat it as the current source of truth for color, type, spacing, and how tokens are consumed.

## The brief, pinned

- **Subject:** a tool that turns one PDF into a guided, sequential lesson.
- **Audience:** a learner mid-study — one screen, one question at a time.
- **The page's single job:** keep that learner inside a focused quiz loop and tell them, unmistakably, whether they got it right.

This is a *focus instrument*, not a marketing page — calm, credible, legible under repetition. Brand color aligns with Memorang (`#0C9488` teal); spend teal on navigation and CTAs, green/red only on grading feedback.

## Core thesis (the decision that shapes everything)

**Teal = brand. Green/red = grading only.**

- `--primary` (`#0C9488`) is for buttons, active rail states, links, and focus rings — never for correct/incorrect feedback.
- `--success` / `--error` are reserved for functional MCQ feedback. Success green is shifted slightly greener (`#0F9D58`) so it stays distinct from brand teal.

When a panel flashes green, it means something — because teal never masquerades as "correct."

## Color palette

Warm-neutral **paper** background with Memorang-aligned teal accent.

| Token | Hex | Role |
|-------|-----|------|
| `--ink` | `#1B1C2A` | Primary text — cool near-black, never pure `#000` |
| `--ink-muted` | `#5A5D72` | Secondary text, captions, labels |
| `--paper` | `#F9F9F9` | App background (warm near-white) |
| `--surface` | `#FFFFFF` | Cards, the MCQ widget, panels |
| `--border` | `#E5E5E5` | Hairlines, dividers, input outlines |
| `--primary` | `#0C9488` | Brand teal — buttons, active rail, focus rings |
| `--primary-strong` | `#0A7D73` | Hover / pressed |
| `--primary-soft` | `#E7F6F4` | Active/selected fills, eyebrow tints |
| `--surface-inverse` | `#1B2B3A` | Reserved for future dark emphasis bands |

### Semantic — reserved, functional

| Token | Hex | Role |
|-------|-----|------|
| `--success` | `#0F9D58` | Correct: border + icon |
| `--success-soft` | `#E3F5EC` | Correct: panel/option fill |
| `--success-ink` | `#11703F` | Correct: text on soft |
| `--error` | `#E0413E` | Incorrect: border + icon |
| `--error-soft` | `#FCEBEA` | Incorrect: panel/option fill |
| `--error-ink` | `#A52723` | Incorrect: text on soft |

### Elevation

| Token | Use |
|-------|-----|
| `--shadow-xs` | Nested items, subtle lift |
| `--shadow-sm` | Default panels and cards |
| `--shadow-md` | Modals, inverse surfaces |

## Typography

Unchanged — Inter body, Bricolage Grotesque display, Geist Mono for data.

| Role | Face | Notes |
|------|------|-------|
| Display / headings | **Bricolage Grotesque** | Used with restraint on titles and section headers |
| Body / UI | **Inter** | Question text, choices, labels |
| Data / numerals | **Geist Mono** | Scores and percentages |

Type scale, weights, and line-heights remain as defined in `packages/tokens/tokens.css`.

## Spacing & radius

4px base scale — tokens `space-1` … `space-8`:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

**Radius:**

| Token | px | Use |
|-------|----|----|
| `--radius-sm` | 8 | Inputs, radios container |
| `--radius-md` | 12 | Cards, widgets, panels |
| `--radius-lg` | 16 | Large containers |

## Panel sizes

Use `Panel` (`apps/edpath-web/components/ui/Panel.tsx`) instead of hand-rolled card divs.

| Size | Padding / gap | Use |
|------|---------------|-----|
| `md` (default) | `p-5 gap-4` | Lesson widgets — MCQ, plan, summary |
| `sm` | `p-4 gap-3` | Objective rail, nested interrupt cards |

Landing upload uses shadcn `Card` with `size="sm"` default.

## Icon system

Use `Icon` (`apps/edpath-web/components/ui/Icon.tsx`) wrapping Lucide icons.

| Size | px | Use |
|------|----|-----|
| `xs` | 14 | Eyebrows, inline labels |
| `sm` | 16 | List items, button leading icons (default) |
| `md` | 20 | Drop zones, emphasis |
| `lg` | 24 | Rare — hero accents only |

**Rules:**
- Default variant is `text-ink-muted` — icons stay quieter than text.
- `stroke-[1.5]` always.
- Primary actions get a leading icon (`variant="inverse"` on filled buttons).
- Use semantic icons (FileUp, ListChecks, CircleHelp, GraduationCap) instead of numbered circles except in the objective rail, where order is meaningful.

## Background texture

Page shell uses `.bg-paper-textured` — a subtle teal dot grid on `--paper`. Panels and cards stay clean `--surface` white so content remains readable.

## Image slots

`MediaSlot` (`apps/edpath-web/components/ui/MediaSlot.tsx`) provides placeholder frames for future product screenshots and illustrations. Variants: `product` (16:9), `square` (1:1), `illustration` (4:3). No assets wired yet.

## Signature element

A persistent **objective rail** down the left of the lesson: the learning objectives as a vertical, numbered spine — completed ones marked, the current one filled with `--primary`, upcoming ones in `--ink-muted`.

- Numbering is justified because the objectives **are** a real ordered sequence.
- The rail reflects checkpointed progress state — distinctive, functional, and nearly free.
- It ties the product's identity directly to its core concept: a *path*.

## How tokens live and how web consumes them

Web is **Tailwind v4 (CSS-first `@theme`)**:

- `packages/tokens/tokens.css` declares all tokens as `:root { --ink: …; --primary: …; }`, then maps them into Tailwind via `@theme inline`.
- `apps/edpath-web/app/globals.css` imports tokens and adds `.bg-paper-textured`.

**Why:** one source of truth, zero drift between CSS variables and Tailwind utilities.
