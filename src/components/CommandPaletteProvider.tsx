'use client'

/**
 * CommandPaletteProvider — exposes a global `useCommandPalette()` hook so any
 * component in the dashboard can open the palette (e.g. a button in the
 * TopBar or a tip in the Getting Started checklist).
 *
 * Mounted once, inside DashboardShell. Owns:
 *   • open/close state
 *   • the global ⌘K / Ctrl+K keyboard shortcut
 *   • the `<CommandPalette/>` instance
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import CommandPalette from './CommandPalette'

interface Ctx {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<Ctx>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
})

export function useCommandPalette() {
  return useContext(CommandPaletteContext)
}

export default function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(v => !v), [])

  // ⌘K / Ctrl+K — opens the palette from anywhere in the app
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </CommandPaletteContext.Provider>
  )
}
