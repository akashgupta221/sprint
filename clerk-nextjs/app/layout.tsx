import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Archivo } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth'],
})

export const metadata: Metadata = {
  title: 'Sprint — Agile project management that never drops the baton',
  description:
    'Kanban, sprint planning, and a notification pipeline built on a durable Postgres outbox. Contract-first APIs, Clerk authentication, and a board that keeps tempo.',
  metadataBase: new URL('https://sprint-pm.vercel.app'),
  openGraph: {
    title: 'Sprint — Agile project management that never drops the baton',
    description:
      'Kanban, sprint planning, and notifications that survive restarts and retries. Built contract-first.',
    type: 'website',
  },
}

// Adds `js` before paint so CSS can safely hide pre-reveal content;
// without JS the page renders fully visible.
const jsClassScript = `document.documentElement.classList.add('js')`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${archivo.variable}`}
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: jsClassScript }} />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
