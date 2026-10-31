import { Reveal } from './reveal'

const FAQS = [
  {
    q: 'Is Sprint free?',
    a: 'Yes — while Sprint is in active development, everything is free to try with a Clerk account. There is no pricing yet, and the page will not pretend otherwise. When pricing exists, it will be announced here first.',
  },
  {
    q: 'Can I read the source code?',
    a: 'Absolutely. Sprint is developed in the open at github.com/akashgupta221/sprint — including the OpenAPI contract, generated clients, database schemas, and the notification worker. The architecture docs explain every tradeoff.',
  },
  {
    q: 'How do notifications actually work?',
    a: 'When something happens, Sprint writes an activity event and a notification row in the same database transaction. A background worker picks them up with FOR UPDATE SKIP LOCKED (safe across multiple instances) and sends emails with exponential backoff and jitter. If the server restarts mid-send, the queue survives in Postgres.',
  },
  {
    q: 'What does “contract-first” mean in practice?',
    a: 'One openapi.yaml file is the single source of truth. Server-side Zod validators and client-side TanStack Query hooks are both generated from it, so the frontend and backend always agree on request and response shapes — by construction, not by discipline.',
  },
  {
    q: 'What do I need to run it myself?',
    a: 'Node.js 20+, pnpm, and a Postgres 15+ instance. Clone the repo, install, set your Clerk keys, and run the API server and web app. The docs/ folder walks through the full setup.',
  },
  {
    q: 'Who is building this?',
    a: 'Sprint is built by Akash Gupta as a demonstration of modern full-stack architecture patterns — contract-driven development, durable background pipelines, and honest engineering. The walkthrough videos show exactly how it is put together.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="max-w-[26ch] font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:110%] sm:text-5xl">
            Questions, answered plainly.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 max-w-3xl">
            {FAQS.map(item => (
              <details
                key={item.q}
                className="group border-b border-border [&:first-child]:border-t"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 transition-colors hover:text-volt [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-semibold text-foreground sm:text-lg">
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative h-4 w-4 shrink-0 text-volt transition-transform duration-300 group-open:rotate-45"
                  >
                    <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rounded bg-current" />
                    <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded bg-current" />
                  </span>
                </summary>
                <p className="max-w-[68ch] pb-6 text-base leading-7 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
