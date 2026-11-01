import { NextResponse } from 'next/server'

const CLERK_API = 'https://api.clerk.com/v1/waitlist_entries'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  let email: string
  try {
    const body = (await request.json()) as { email?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Send a JSON body like { "email": "you@example.com" }.' },
      { status: 400 }
    )
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, message: 'That email address doesn’t look right — check it and try again.' },
      { status: 400 }
    )
  }

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { ok: false, message: 'Waitlist is not configured yet. Try again soon.' },
      { status: 500 }
    )
  }

  const response = await fetch(CLERK_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email }),
  })

  if (response.status === 422) {
    // Clerk rejects duplicates with 422 — treat as success for the visitor.
    return NextResponse.json({
      ok: true,
      message: 'You’re already on the list — we’ll email you when your workspace is ready.',
    })
  }

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: 'Couldn’t add you right now — please try again in a moment.' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'You’re on the list! We’ll email you when your workspace is ready.',
  })
}
