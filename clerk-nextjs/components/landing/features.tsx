'use client'

import { useEffect, useState } from 'react'
import { Bell, CircleCheck, Clock, RotateCcw } from 'lucide-react'
import { Reveal } from './reveal'

/* ------------------------------------------------------------------ */
/* Sample kanban board — clearly labeled illustrative data            */
/* ------------------------------------------------------------------ */

type Card = {
  id: string
  title: string
  tag: string
  points: number
  assignee: string
}

type Column = { id: string; name: string; cards: Card[] }

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'planned',
    name: 'Planned',
    cards: [
      {
        id: 'c1',
        title: 'Sprint burndown chart',
        tag: 'Analytics',
        points: 5,
        assignee: 'RK',
      },
      {
        id: 'c2',
        title: 'Bulk move to backlog',
        tag: 'Board',
        points: 2,
        assignee: 'AM',
      },
    ],
  },
  {
    id: 'insprint',
    name: 'In sprint',
    cards: [
      {
        id: 'c3',
        title: 'Webhook delivery settings',
        tag: 'Notifications',
        points: 3,
        assignee: 'JT',
      },
      {
        id: 'c4',
        title: 'Sprint velocity report',
        tag: 'Analytics',
        points: 5,
        assignee: 'RK',
      },
    ],
  },
  {
    id: 'done',
    name: 'Done',
    cards: [
      {
        id: 'c5',
        title: 'Drag-and-drop reordering',
        tag: 'Board',
        points: 8,
        assignee: 'AM',
      },
    ],
  },
]

const CYCLE_MS = 3200

function BoardMock() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS)
  const [moving, setMoving] = useState<string | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const timer = setInterval(() => {
      setColumns(current => {
        const firstNonEmpty = current.find(col => col.cards.length > 0)
        if (!firstNonEmpty) return INITIAL_COLUMNS.map(c => ({ ...c, cards: [...c.cards] }))
        const next = current.map(col => ({ ...col, cards: [...col.cards] }))
        const from = next.findIndex(col => col.cards.length > 0)
        const card = next[from].cards.shift()!
        const to = (from + 1) % next.length
        setMoving(card.id)
        next[to].cards.push(card)
        return next
      })
      setTimeout(() => setMoving(null), 500)
    }, CYCLE_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_oklch(0.05_0.01_160/0.5)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-xl font-bold tracking-tight">
          A board that keeps tempo
        </h3>
        <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
          SAMPLE DATA
        </span>
      </div>
      <p className="mt-2 max-w-[52ch] text-sm leading-6 text-muted-foreground">
        Drag, drop, done. Cards move across lanes the moment work moves — and
        everyone watching the sprint sees it happen.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-3 gap-3">
        {columns.map(col => (
          <div
            key={col.id}
            className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 p-2.5"
          >
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-xs font-semibold text-foreground">
                {col.name}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {col.cards.reduce((sum, card) => sum + card.points, 0)} pts
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.cards.map(card => (
                <div
                  key={card.id}
                  className={`rounded-lg border border-border bg-card p-2.5 transition-all duration-500 ${
                    moving === card.id
                      ? 'scale-[1.03] border-volt/60 shadow-[0_4px_16px_oklch(0.9_0.2_127/0.15)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-volt" />
                    <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                      {card.tag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium leading-4 text-foreground">
                    {card.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent font-mono text-[9px] font-bold text-accent-foreground">
                      {card.assignee}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {card.points} pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Durable notification pipeline — the mechanism Sprint stands on     */
/* ------------------------------------------------------------------ */

type OutboxRow = {
  id: number
  event: string
  status: 'sent' | 'retrying' | 'queued'
  note: string
}

const OUTBOX_ROWS: OutboxRow[] = [
  { id: 0, event: 'task.moved', status: 'sent', note: 'delivered in 1.2s' },
  { id: 1, event: 'sprint.started', status: 'sent', note: 'delivered in 0.8s' },
  { id: 2, event: 'comment.added', status: 'retrying', note: 'attempt 3 · backoff 2^n + jitter' },
  { id: 3, event: 'member.invited', status: 'queued', note: 'waiting for worker pickup' },
]

function PipelineMock() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(
      () => setActive(value => (value + 1) % OUTBOX_ROWS.length),
      1800
    )
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_oklch(0.05_0.01_160/0.5)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-xl font-bold tracking-tight">
          Notifications that refuse to die
        </h3>
        <Bell className="h-5 w-5 text-volt" />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Every email rides a durable Postgres outbox — not a fire-and-forget
        call. SMTP hiccup? The worker retries with exponential backoff while
        your request returns instantly.
      </p>

      <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-border/70 bg-background/60">
        <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2.5">
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
            notifications
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-[soft-pulse_1.8s_ease-in-out_infinite] rounded-full bg-volt" />
            FOR UPDATE SKIP LOCKED
          </span>
        </div>
        <div>
          {OUTBOX_ROWS.map((row, index) => (
            <div
              key={row.id}
              className={`flex items-center justify-between gap-2 border-b border-border/40 px-3.5 py-2.5 transition-colors duration-500 last:border-b-0 ${
                index === active ? 'bg-volt-dim' : ''
              }`}
            >
              <span className="truncate font-mono text-[11px] text-foreground">
                {row.event}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {row.status === 'sent' && (
                  <CircleCheck className="h-3.5 w-3.5 text-volt" />
                )}
                {row.status === 'retrying' && (
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                )}
                {row.status === 'queued' && (
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                  {row.note}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-wider text-muted-foreground">
        SAMPLE QUEUE — ILLUSTRATIVE
      </p>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal>
        <h2 className="max-w-[24ch] font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:110%] sm:text-5xl">
          Everything a sprint needs. Nothing it doesn’t.
        </h2>
        <p className="mt-5 max-w-[62ch] text-lg leading-8 text-muted-foreground">
          Sprint covers the daily loop — plan, move, finish, notify — and is
          honest about what it is: a young, fast-moving tool you can read the
          source of.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-12">
        <Reveal variant="clip" className="md:col-span-7">
          <BoardMock />
        </Reveal>
        <Reveal variant="clip" delay={120} className="md:col-span-5">
          <PipelineMock />
        </Reveal>

        <Reveal delay={0} className="md:col-span-4">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-lg font-bold tracking-tight">
              One contract, zero drift
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A single OpenAPI spec generates the server’s Zod validation and
              the client’s query hooks. Frontend and backend literally cannot
              disagree about shapes.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="rounded-md border border-border bg-background/70 px-2 py-1 text-volt">
                openapi.yaml
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-md border border-border bg-background/70 px-2 py-1">
                api-zod/
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-md border border-border bg-background/70 px-2 py-1">
                api-client-react/
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={90} className="md:col-span-4">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-lg font-bold tracking-tight">
              A stack you can audit
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No proprietary magic. The whole system is ordinary, readable
              TypeScript over Postgres.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {[
                'Next.js 16 · React 19',
                'Postgres 15+ · Drizzle ORM',
                'Clerk authentication',
                'TanStack Query client',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-volt" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={180} className="md:col-span-4">
          <div className="flex h-full flex-col rounded-2xl border border-volt/25 bg-gradient-to-b from-volt-dim to-card p-5 sm:p-6">
            <h3 className="font-heading text-lg font-bold tracking-tight">
              Open by default
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every design decision and its tradeoffs is written down. Read the
              architecture docs, watch the walkthroughs, then tell us where you
              disagree.
            </p>
            <a
              href="https://github.com/akashgupta221/sprint"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-volt hover:underline"
            >
              Read the source on GitHub
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
