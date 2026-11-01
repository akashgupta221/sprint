'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Reveal } from './reveal'

const VIDEOS = [
  {
    id: 'Sumf3ThXkvk',
    title: 'Project overview, architecture, and key features',
    length: 'Overview',
  },
  {
    id: 'ZmLD1TLM-WE',
    title: 'Live demo walkthrough',
    length: 'Demo',
  },
]

function VideoFacade({ id, title, tag }: { id: string; title: string; tag: string }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_8px_24px_rgba(36,46,66,0.08)] transition-transform hover:-translate-y-1"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      <Image
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 768px) 560px, 100vw"
        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(49,76,129,0.35)] transition-transform group-hover:scale-110">
        <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="text-sm font-medium leading-5 text-foreground">
          {title}
        </span>
        <span className="shrink-0 rounded-full border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
          {tag}
        </span>
      </span>
    </button>
  )
}

export function Walkthrough() {
  return (
    <section
      id="walkthrough"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[22ch] font-heading text-4xl font-extrabold tracking-[-0.03em] [font-stretch:110%] sm:text-5xl">
            Watch it run before you trust it.
          </h2>
          <p className="max-w-[46ch] text-base leading-7 text-muted-foreground">
            Two full walkthroughs: the architecture tour, then a live demo —
            recorded by the person who built it, warts and all.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {VIDEOS.map((video, index) => (
          <Reveal key={video.id} variant="clip" delay={index * 120}>
            <VideoFacade id={video.id} title={video.title} tag={video.length} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
