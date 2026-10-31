'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type RevealVariant = 'rise' | 'clip'

/**
 * Marks a subtree for scroll reveal. The hidden state lives in CSS under
 * `html.js` only, so the page stays fully visible without JavaScript.
 * Visibility is React state, so it survives re-renders.
 */
export function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  className,
  style,
}: {
  children: ReactNode
  variant?: RevealVariant
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    observer.observe(node)
    // Belt and braces: if the node is already on screen (e.g. restored
    // scroll position), reveal immediately instead of waiting for IO.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      setVisible(true)
      observer.disconnect()
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal={variant}
      className={`${className ?? ''} ${visible ? 'is-visible' : ''}`.trim() || undefined}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
