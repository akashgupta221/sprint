'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { SignUpButton, Show } from '@clerk/nextjs'
import GradientWaves from '@/components/GradientWaves'

const DATA_STRIP = [
  'OPENAPI CONTRACT-FIRST',
  'FOR UPDATE SKIP LOCKED',
  'EXPONENTIAL BACKOFF + JITTER',
  'DURABLE POSTGRES OUTBOX',
  'NEXT.JS 16',
  'REACT 19',
  'DRIZZLE ORM',
  'TANSTACK QUERY',
  'CLERK AUTH',
  'TYPE-SAFE END TO END',
]

function DataStrip() {
  return (
    <div
      className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-border/60 bg-background/70 py-3.5 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      aria-hidden="true"
    >
      <div className="animate-marquee flex w-max items-center gap-8">
        {[0, 1].map(copy => (
          <div
            key={copy}
            className="flex items-center gap-8 font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
          >
            {DATA_STRIP.map(item => (
              <span key={item} className="flex items-center gap-8">
                {item}
                <span className="h-1 w-1 rounded-full bg-volt/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden">
      {/* The floodlit ocean — the page's one authored moment */}
      <div className="absolute inset-0">
        <GradientWaves
          className="!h-full"
          horizonColor="#22380F"
          waveColor="#4D7C0F"
          crestColor="#D9F99D"
          speed={0.35}
          swell={30}
          turbulence={18}
          zoom={1.05}
          brightness={1.05}
          sheen={0.5}
          grain={0.12}
          dpr={1.5}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/70 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-36 pt-32 sm:px-8">
        <div className="max-w-3xl">
          <h1 className="font-heading text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] [font-stretch:112%] sm:text-6xl md:text-7xl">
            <span className="block overflow-hidden pb-1">
              <span className="block animate-[hero-unmask_0.9s_cubic-bezier(0.22,1,0.36,1)_0.15s_both]">
                Run sprints
              </span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="block animate-[hero-unmask_0.9s_cubic-bezier(0.22,1,0.36,1)_0.3s_both]">
                that <span className="text-volt">actually finish.</span>
              </span>
            </span>
          </h1>

          <p className="mt-7 max-w-[62ch] animate-[hero-rise_0.8s_cubic-bezier(0.22,1,0.36,1)_0.55s_both] text-lg leading-8 text-muted-foreground sm:text-xl">
            Sprint is agile project management with an engineering-grade
            backbone: a kanban board that keeps tempo, sprint planning that
            sticks, and notifications that survive restarts, retries, and real
            life.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-[hero-rise_0.8s_cubic-bezier(0.22,1,0.36,1)_0.75s_both]">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_6px_24px_oklch(0.9_0.2_127/0.3)] transition-transform hover:-translate-y-0.5">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_6px_24px_oklch(0.9_0.2_127/0.3)] transition-transform hover:-translate-y-0.5"
              >
                Open your dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Show>
            <a
              href="#architecture"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-accent"
            >
              See the machinery
              <ArrowDown className="h-4 w-4 text-volt" />
            </a>
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              free while in development — no pricing yet
            </span>
          </div>
        </div>
      </div>

      <DataStrip />
    </section>
  )
}
