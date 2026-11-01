'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SignUpButton, Show } from '@clerk/nextjs'
import { Reveal } from './reveal'
import { Wordmark } from './logo'

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <Reveal variant="clip">
        <div className="relative overflow-hidden rounded-3xl border border-volt/25 bg-gradient-to-b from-volt-dim to-card px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* lane lines radiating from the horizon — flat geometry, not glow */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
            viewBox="0 0 800 300"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <line
                key={i}
                x1="400"
                y1="310"
                x2={400 + (i - 3) * 320}
                y2="-20"
                stroke="var(--volt)"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          <div className="relative">
            <h2 className="mx-auto max-w-[18ch] font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:112%] sm:text-5xl md:text-6xl">
              Your next sprint starts in seconds.
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
              Sign up, invite your team, plan the work. Free while Sprint is in
              development — and open enough that you can read every line
              behind it.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(49,76,129,0.28)] transition-transform hover:-translate-y-0.5">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(49,76,129,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  Open your dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Show>
              <a
                href="https://github.com/akashgupta221/sprint"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-accent"
              >
                View the source
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#architecture' },
      { label: 'Walkthrough', href: '#walkthrough' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Project',
    links: [
      {
        label: 'GitHub repository',
        href: 'https://github.com/akashgupta221/sprint',
      },
      {
        label: 'Architecture docs',
        href: 'https://github.com/akashgupta221/sprint/tree/main/docs',
      },
      { label: 'Overview video', href: 'https://youtu.be/Sumf3ThXkvk' },
      { label: 'Demo video', href: 'https://youtu.be/ZmLD1TLM-WE' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-[40ch] text-sm leading-6 text-muted-foreground">
            Agile project management with an engineering-grade backbone.
            Contract-first, durable by design, built in the open.
          </p>
        </div>
        {FOOTER_COLS.map(col => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
              {col.heading.toUpperCase()}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(link => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-sm text-foreground/85 transition-colors hover:text-volt"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/85 transition-colors hover:text-volt"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <p className="text-xs text-muted-foreground">
            Built by Akash Gupta · Sprint is in active development
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            AUTH BY CLERK · HOSTED ON VERCEL
          </p>
        </div>
      </div>
    </footer>
  )
}
