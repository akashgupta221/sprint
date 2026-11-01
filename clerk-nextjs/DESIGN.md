---
name: Sprint
description: Agile project management marketing site and app shell — the "Crisp Navy Playbook" world
colors:
  ground: "#f9fbfa"
  surface: "#ffffff"
  surface-sunken: "#f3f6f5"
  ink: "#242e42"
  ink-secondary: "#5c6b8a"
  navy: "#314c81"
  accent: "#3b82f6"
  accent-quiet: "rgba(59, 130, 246, 0.12)"
  hairline: "#dde3e1"
  wave-body: "#3E5C99"
  wave-crest: "#7FA3E0"
  wave-horizon: "#314C81"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0em"
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.18em"
rounded:
  sm: "7px"
  md: "14px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "48px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Sprint — Design System

## Overview

**Creative North Star: "Crisp Navy Playbook."** Sprint's interface is a clean, light workspace — the same shade family as the product's reference app (`email-workflow-manager`): light cool-gray ground, white cards, slate-navy ink, navy primary actions, and one brighter royal-blue accent carrying highlights. Machinery is shown, not decorated around: boards move, queues retry, connectors draw.

**Key Characteristics:**

- Light theme only. Depth comes from hairline borders and soft navy-tinted shadows, never dark surfaces.
- The accent (`#3B82F6`) is the brightest thing on the page and stays in the navy shade family.
- Monospace is reserved for measurements, file names, and spec names — never as a "technical" costume.
- Motion is calm but alive: the hero's light-mode WebGL ocean is the single authored moment; everything else reveals once and settles.
- Honesty is visual too: sample data is labeled, claims are real, no invented proof.

## Colors

- **Navy** (`{colors.navy}`) — primary buttons and filled elements; white text on top (~8:1).
- **Accent bright blue** (`{colors.accent}`) — headline highlights, links, focus rings, diagram nodes, plus icons. The only saturated color; always in the navy family.
- **Ground** (`{colors.ground}`) — page background; **Surface** (`{colors.surface}`) cards; **Surface sunken** (`{colors.surface-sunken}`) wells and hover fills.
- **Ink** (`{colors.ink}`) headings and body; **Ink secondary** (`{colors.ink-secondary}`) supporting copy (≥4.5:1 on ground).
- **Hairline** (`{colors.hairline}`) — structural borders on cards and dividers.
- **Wave trio** (`wave-horizon` / `wave-body` / `wave-crest`) — GradientWaves hero in `lightMode`: navy fog, steel-navy body, periwinkle crests.

**The Same-Shade Rule.** Every color on the page belongs to the reference app's navy/slate family. New colors must be siblings of navy `#314C81` or slate `#242E42` — never foreign hues. Semantic amber (retry states in illustrative data) is the sole exception.

## Typography

- **Archivo** (variable, `wdth` axis) is the display voice — extrabold, width-stretched to 110–112%, tracking −0.03em.
- **Geist** is the text voice for body and UI. Measure stays at 45–65ch.
- **Geist Mono** appears only where content is literally data: event names, queue notes, spec names, and the hero's data strip (uppercase, 0.18em tracking).

## Layout

- Content column: `max-w-6xl` (1152px) with 20–32px gutters.
- Sections breathe at 96–128px vertical padding; more space above headings than below.
- Features use an asymmetric bento (7/5 then 4/4/4) — panels differ in content type, not clones of one card.
- Mobile: single column, CTAs stack, board mock compresses to three slim lanes; display steps from 4.5rem to 3rem.

## Elevation & Depth

Elevation is structural — soft shadow with offset, tinted navy-gray for the light ground:

- `0 2px 10px rgba(49, 76, 129, 0.3)` — primary controls.
- `0 4px 14px rgba(49, 76, 129, 0.28)` — hero-scale primary buttons.
- `0 8px 24px rgba(36, 46, 66, 0.08)` — panel lift on the light ground.

## Shapes

- Cards and wells: 14px radius (`{rounded.md}`); the final CTA banner: 24px. Pills are reserved for controls (buttons, tags, avatars).
- Structure is hairline borders, not filled strokes; depth is shadow, not borders.

## Components

- **button-primary** — navy pill, white text, small navy shadow; hover lifts −2px.
- **button-ghost** — transparent pill with hairline border; hover fills `accent-quiet`.
- **panel** — white card: 14px radius, hairline border, panel shadow, 24px padding.
- **data-strip** — marquee of spec names in mono, masked fade at both edges, accent dot separators.
- **faq-row** — full-width `details/summary`; question in semibold ink, accent plus mark rotating 45° when open, hairline separators.
- **video-facade** — real thumbnail, navy play disc, light scrim; swaps to an iframe on click.

## Do's and Don'ts

- **Do** keep every color inside the navy/slate family; **don't** introduce foreign hues (green, violet, warm accents).
- **Do** use mono for measurements and spec names; **don't** use it for headings or marketing copy.
- **Do** label sample/illustrative data (the board mock says SAMPLE DATA); **don't** present invented metrics or testimonials as real.
- **Don't** add eyebrows/kickers above headings — the heading carries its own weight.
- **Don't** scatter identical entrance animations; the hero owns the big moment, sections reveal once and stop.
- **Don't** revert to dark surfaces — the light world is a user-confirmed direction.
