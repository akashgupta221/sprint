'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// WebGL ocean is heavy — load it after first paint so text renders fast.
const GradientWaves = dynamic(() => import('@/components/GradientWaves'), {
  ssr: false,
  loading: () => null,
});

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
];

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
  );
}

export function HeroWaves() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden">
      {/* The floodlit ocean — loads after paint */}
      <div className="absolute inset-0">
        {mounted && (
          <GradientWaves
            className="!h-full"
            lightMode
            horizonColor="#314C81"
            waveColor="#3E5C99"
            crestColor="#7FA3E0"
            speed={0.35}
            swell={30}
            turbulence={18}
            zoom={1.1}
            amplitude={3}
            brightness={1.15}
            fogDepth={9}
            sheen={0.4}
            grain={0.06}
            dpr={1.5}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/70 to-transparent" />
      <DataStrip />
    </section>
  );
}
