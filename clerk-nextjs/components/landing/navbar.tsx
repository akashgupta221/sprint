'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from '@clerk/nextjs'
import { Wordmark } from './logo'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#architecture', label: 'How it works' },
  { href: '#walkthrough', label: 'Walkthrough' },
  { href: '#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Sprint home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hidden cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_2px_10px_rgba(49,76,129,0.3)] transition-transform hover:-translate-y-0.5">
                Start free
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_2px_10px_rgba(49,76,129,0.3)] transition-transform hover:-translate-y-0.5"
            >
              Open app
            </Link>
            <UserButton />
          </Show>

          <button
            className="ml-1 cursor-pointer rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
              >
                {link.label}
              </a>
            ))}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="mt-2 cursor-pointer rounded-xl px-3 py-3 text-left text-base font-medium text-muted-foreground hover:bg-accent">
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      )}
    </header>
  )
}
