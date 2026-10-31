---
name: Sprint
description: Agile project management marketing site and app shell — the "floodlit night track" world
colors:
  ground: "oklch(0.155 0.006 160)"
  surface: "oklch(0.19 0.008 160)"
  surface-raised: "oklch(0.23 0.008 160)"
  ink: "oklch(0.96 0.006 120)"
  ink-secondary: "oklch(0.72 0.02 150)"
  volt: "oklch(0.9 0.2 127)"
  volt-on: "oklch(0.17 0.015 140)"
  volt-quiet: "oklch(0.9 0.2 127 / 14%)"
  moss-deep: "oklch(0.26 0.03 140)"
  wave-body: "#4D7C0F"
  wave-crest: "#D9F99D"
  wave-horizon: "#22380F"
  hairline: "oklch(0.98 0.01 130 / 9%)"
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
    backgroundColor: "{colors.volt}"
    textColor: "{colors.volt-on}"
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

**Creative North Star: "The Floodlit Night Track."** Sprint's interface is a stadium after dark: a near-black green-tinted ground, one volt-lime light carrying the page, and lane-line hairlines marking structure. The design shows machinery rather than decorating around it — boards move, queues retry, connectors draw.

**Key Characteristics:**

- One saturated accent (volt) is allowed to carry whole regions; everything else stays quiet and dark.
- Monospace is reserved for measurements, file names, and spec names — never as a "technical" costume.
- Motion is calm but alive: the hero's WebGL ocean is the single authored moment; everything else reveals once and settles.
- Honesty is visual too: sample data is labeled, claims are real, no invented proof.

## Colors

- **Volt** (`{colors.volt}`) — primary actions, active states, wave crests of light, focus rings, selection. Always paired with `{colors.volt-on}` text for ~13:1 contrast.
- **Ground** (`{colors.ground}`) — page background; slightly green-tinted near-black, never pure `#000`.
- **Surface** (`{colors.surface}`) / **Surface raised** (`{colors.surface-raised}`) — cards and wells.
- **Ink** (`{colors.ink}`) body text; **Ink secondary** (`{colors.ink-secondary}`) for supporting copy — tinted from the green hue, not gray.
- **Wave trio** (`wave-horizon` / `wave-body` / `wave-crest`) — the GradientWaves hero palette: deep moss fog, lime-700 body, lime-100 crests.
- **Hairline** (`{colors.hairline}`) — 9%-alpha warm-white borders; structure comes from these lines, not from heavy strokes.

**The One-Light Rule.** Volt is the only saturated color on the page. If a second hue must appear (amber retry states in illustrative data), it is semantic and temporary, never decorative.

## Typography

- **Archivo** (variable, `wdth` axis) is the display voice — extrabold, width-stretched to 110–112%, tracking −0.03em. Athletic, timed-track character.
- **Geist** is the text voice for body and UI. Measure stays at 45–65ch.
- **Geist Mono** appears only where content is literally data: event names, queue notes, spec names, and the hero's data strip (uppercase, 0.18em tracking).

## Layout

- Content column: `max-w-6xl` (1152px) with 20–32px gutters.
- Sections breathe at 96–128px vertical padding; more space above headings than below.
- Features use an asymmetric bento (7/5 then 4/4/4) — panels differ in content type, not clones of one card.
- Mobile: single column, CTAs stack, board mock compresses to three slim lanes; type steps down from `display` 4.5rem to 3rem.

## Elevation & Depth

Elevation is structural, layered soft shadow with offset — never a zero-offset halo:

- `0 2px 12px oklch(0.9 0.2 127 / 25%)` — small volt glow under primary controls.
- `0 6px 24px oklch(0.9 0.2 127 / 30%)` — hero-scale primary buttons.
- `0 8px 32px oklch(0.05 0.01 160 / 50%)` — panel lift on the dark ground.

## Shapes

- Cards and wells: 14px radius (`{rounded.md}`); the final CTA banner: 24px. Pills are reserved for controls (buttons, tags, avatars).
- Structure is hairline borders, not filled strokes; depth is shadow, not borders.

## Components

- **button-primary** — volt pill, volt-on text, small volt shadow; hover lifts −2px.
- **button-ghost** — transparent pill with hairline border; hover fills `moss-deep`.
- **panel** — surface card: 14px radius, hairline border, panel shadow, 24px padding.
- **data-strip** — marquee of spec names in mono, masked fade at both edges, volt dot separators.
- **faq-row** — full-width `details/summary`; question in semibold ink, volt plus mark rotating 45° when open, hairline separators.
- **video-facade** — real thumbnail, volt play disc, gradient scrim; swaps to an iframe on click.

## Do's and Don'ts

- **Do** keep secondary text tinted from the green hue (`ink-secondary`); **don't** drop in neutral gray.
- **Do** use mono for measurements and spec names; **don't** use it for headings or marketing copy.
- **Do** label sample/illustrative data (the board mock says SAMPLE DATA); **don't** present invented metrics or testimonials as real.
- **Don't** add eyebrows/kickers above headings — the heading carries its own weight.
- **Don't** scatter identical entrance animations; the hero owns the big moment, sections reveal once and stop.
- **Don't** introduce a second saturated accent; semantic amber in illustrative data is the only exception.
