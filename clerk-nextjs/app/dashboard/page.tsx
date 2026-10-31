import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CircleCheck, Clock } from 'lucide-react'
import { currentUser } from '@clerk/nextjs/server'
import { Show, RedirectToSignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Your workspace — Sprint',
}

function Welcome({ name }: { name: string }) {
  const firstName = name.split(' ')[0]
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
        SPRINT / WORKSPACE
      </p>
      <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:110%] sm:text-5xl">
        You’re in, {firstName}.
      </h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-8 text-muted-foreground">
        Authentication is live — everything after this line is the app being
        built sprint by sprint. Here is what exists today and what’s next:
      </p>

      <div className="mt-10 space-y-3">
        <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-volt" />
          <div>
            <p className="font-semibold">Account and sessions</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Sign-up, sign-in, and this protected route run on Clerk with
              production keys.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-volt" />
          <div>
            <p className="font-semibold">The full product engine</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Projects, members, sprints, and the durable notification
              pipeline are working in the main implementation — watch the{' '}
              <a
                href="https://youtu.be/ZmLD1TLM-WE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-volt hover:underline"
              >
                live demo
              </a>
              .
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3.5 rounded-2xl border border-dashed border-border bg-card/50 p-5">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold">This workspace, in the browser</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The board UI is being ported to Next.js right now. Follow along
              in the{' '}
              <a
                href="https://github.com/akashgupta221/sprint"
                target="_blank"
                rel="noopener noreferrer"
                className="text-volt hover:underline"
              >
                repository
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-volt"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the landing page
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <Show when="signed-in">
        <Dashboard />
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  )
}

async function Dashboard() {
  const user = await currentUser()
  const name = user?.fullName ?? user?.username ?? 'there'
  return <Welcome name={name} />
}
