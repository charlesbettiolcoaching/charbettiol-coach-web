'use client'

/**
 * TypeIn — subtly types a string character-by-character with a blinking caret.
 *
 * Used in the AI briefing card to sell the illusion that the AI just wrote
 * this text for the coach. Runs once on mount (keyed re-runs on content change).
 */

import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface Props {
  text: string
  /** ms per character. Default 18 for a quick but visible type-in. */
  speedMs?: number
  /** Delay before typing starts (ms). */
  delayMs?: number
  /** Show a blinking caret while typing. */
  caret?: boolean
  className?: string
  /** Called when typing completes. */
  onDone?: () => void
}

export default function TypeIn({
  text,
  speedMs = 18,
  delayMs = 180,
  caret = true,
  className,
  onDone,
}: Props) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let raf = 0
    let cancelled = false
    setShown('')
    setDone(false)

    const start = performance.now() + delayMs
    const tick = (t: number) => {
      if (cancelled) return
      const elapsed = t - start
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return }
      const chars = Math.min(text.length, Math.floor(elapsed / speedMs))
      setShown(text.slice(0, chars))
      if (chars < text.length) {
        raf = requestAnimationFrame(tick)
      } else {
        setDone(true)
        onDone?.()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [text, speedMs, delayMs, onDone])

  return (
    <span className={className}>
      {shown}
      {caret && !done && (
        <span
          aria-hidden
          className="inline-block w-[2px] h-[1em] align-middle bg-brand ml-0.5 animate-caret"
          style={{ transform: 'translateY(-1px)' }}
        />
      )}
    </span>
  )
}
