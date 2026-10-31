# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: product managers and agile software teams (startups to mid-size) who run their work in sprints. They plan sprints, move work across a kanban board, coordinate with teammates, and need to trust that nothing falls through the cracks. Secondary: engineers on the same teams who care about API quality and tooling.

## Product Purpose

Sprint is an agile project management tool: sprint planning, a kanban board for projects, team members, and a notification pipeline that keeps people informed. Success for the user: a team can sign up, create a project, plan a sprint, and stay reliably notified about what changed — without the tool getting in the way.

## Positioning

Contract-driven engineering: a single OpenAPI specification synchronizes server-side Zod validation and generated TanStack Query client hooks, so frontend and backend can never drift. Combined with a durable, Postgres-backed notification outbox (multi-instance worker safety, `FOR UPDATE SKIP LOCKED`, exponential-backoff retry), Sprint's mechanism is engineering transparency and reliability a neighboring PM tool could not truthfully copy.

## Operating Context

Solo-built project evolving from prototype to product; lives in a public GitHub repo (`akashgupta221/sprint`) with architecture docs in `docs/` and two YouTube walkthrough videos. This Next.js app (`clerk-nextjs/`) is the product's marketing site and app shell; the mature React/Express implementation lives in `artifacts/`. Development workflows: pnpm workspaces, Clerk authentication (production keys in dev), Vercel as deploy target.

## Capabilities and Constraints

- Auth via Clerk (sign-in/sign-up modals, protected routes through `proxy.ts` / `clerkMiddleware`).
- Real API surface observed in the product: projects, members, notifications, dashboard summary and activity endpoints.
- Stack for this app: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn, react-bits registry components.
- Technical constraints: Next.js 16 conventions (async server APIs, `proxy.ts` replaces `middleware.ts`); WebGL background components must degrade gracefully (reduced-motion, no WebGL).
- Explicitly undecided: monetization/pricing — none exists yet; the page must not fabricate pricing or testimonials.

## Brand Commitments

- Name: **Sprint** (agile connotation is intentional — 🏃‍♂️ in the README).
- Voice: technically candid, confident, concrete; explains tradeoffs rather than hiding them (README tone).
- Evidence assets that may be shown: two YouTube walkthroughs (`https://youtu.be/Sumf3ThXkvk`, `https://youtu.be/ZmLD1TLM-WE`), GitHub repo, architecture docs.

## Evidence on Hand

- Two YouTube walkthrough videos (links above) — real, may be embedded/linked.
- Public GitHub repository with a documented architecture (OpenAPI spec, generated clients, Drizzle schemas, notification outbox design docs).
- No customer testimonials, no usage metrics, no pricing — future work must not fabricate these.

## Product Principles

1. **Trust through transparency** — show how it's built; honesty is a feature.
2. **Nothing falls through the cracks** — durable notifications and reliable state are the promise.
3. **Speed with intent** — sprints are about momentum; the product should feel fast and deliberate.
4. **Contract-first quality** — never let frontend and backend disagree.
