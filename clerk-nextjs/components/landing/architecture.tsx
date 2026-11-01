'use client'

import { BookOpen } from 'lucide-react'
import { Reveal } from './reveal'

/**
 * Contract-first pipeline as crisp linework. Connectors draw themselves
 * when the section scrolls into view (animation gated on .is-visible).
 */
export function Architecture() {
  return (
    <section
      id="architecture"
      className="scroll-mt-24 border-y border-border bg-card/40"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <Reveal>
          <h2 className="max-w-[20ch] font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:110%] sm:text-5xl">
            Built contract-first, on purpose.
          </h2>
          <p className="mt-5 max-w-[58ch] text-lg leading-8 text-muted-foreground">
            Most tools of this size grow integration bugs the same way: the
            frontend assumes a shape, the backend ships another. Sprint
            refuses the premise — one OpenAPI specification is the single
            source of truth, and both sides are generated from it.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              {
                title: 'The spec is the contract',
                body: 'openapi.yaml defines every route, request, and response. Change it and both sides regenerate.',
              },
              {
                title: 'The server cannot lie',
                body: 'Generated Zod schemas validate every request at the boundary. Bad data never reaches Postgres.',
              },
              {
                title: 'The client cannot guess',
                body: 'Generated TanStack Query hooks mean the UI is typed against the exact API that exists — not the one someone remembers.',
              },
            ].map(item => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-volt" />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href="https://github.com/akashgupta221/sprint/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-volt hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            Read the architecture docs
          </a>
        </Reveal>

        <Reveal variant="clip" delay={150}>
          <div className="rounded-2xl border border-border bg-background/70 p-6 shadow-[0_8px_24px_rgba(36,46,66,0.08)] sm:p-8">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
                lib/api-spec/openapi.yaml
              </span>
              <span className="rounded-full bg-volt-dim px-2.5 py-1 font-mono text-[10px] text-volt">
                single source of truth
              </span>
            </div>

            <svg
              viewBox="0 0 460 240"
              className="mt-2 w-full"
              role="img"
              aria-label="Diagram: one OpenAPI specification generates server validation and client hooks"
            >
              <defs>
                <style>{`
                  .flow { stroke-dasharray: 6 5; stroke-dashoffset: 220; }
                  .is-visible .flow { animation: lane-dash 1.6s cubic-bezier(0.22,1,0.36,1) 0.4s forwards; }
                `}</style>
              </defs>

              {/* spec node */}
              <rect x="160" y="14" width="140" height="44" rx="10" fill="var(--volt)" />
              <text
                x="230"
                y="41"
                textAnchor="middle"
                fill="var(--primary-foreground)"
                fontSize="13"
                fontWeight="700"
                fontFamily="var(--font-geist-mono)"
              >
                openapi.yaml
              </text>

              {/* connectors */}
              <path
                className="flow"
                d="M 180 58 C 120 90, 110 100, 110 108"
                stroke="var(--volt)"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                className="flow"
                d="M 280 58 C 340 90, 350 100, 350 108"
                stroke="var(--volt)"
                strokeWidth="1.6"
                fill="none"
              />

              {/* server node */}
              <rect x="24" y="108" width="172" height="112" rx="12" fill="var(--card)" stroke="var(--border)" />
              <text x="110" y="134" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600" fontFamily="var(--font-geist-sans)">
                Express 5 API server
              </text>
              <rect x="36" y="148" width="148" height="26" rx="7" fill="var(--background)" stroke="var(--border)" />
              <text x="110" y="165" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-geist-mono)">
                api-zod/ (generated)
              </text>
              <text x="110" y="200" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-geist-mono)">
                Zod validates every request
              </text>

              {/* client node */}
              <rect x="264" y="108" width="172" height="112" rx="12" fill="var(--card)" stroke="var(--border)" />
              <text x="350" y="134" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600" fontFamily="var(--font-geist-sans)">
                React 19 frontend
              </text>
              <rect x="276" y="148" width="148" height="26" rx="7" fill="var(--background)" stroke="var(--border)" />
              <text x="350" y="165" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9.5" fontFamily="var(--font-geist-mono)">
                api-client-react/ (gen)
              </text>
              <text x="350" y="200" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-geist-mono)">
                typed TanStack Query hooks
              </text>
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
