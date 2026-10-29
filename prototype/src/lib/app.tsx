import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ShiftId } from '../data/types'
import { getCurrentShiftId } from './queries'

export type Theme = 'light' | 'dark'
export type Density = 'comfortable' | 'compact'

export interface ToastInput { message: string; /** When given, shows an Undo button for `durationMs` (default 10 s). */ undo?: () => void; durationMs?: number }
export interface ToastItem extends ToastInput { id: number }
export interface PaletteAction {
  id: string
  title: string
  meta?: string
  /** Display only, e.g. "a" or "g n". Use keyOf() from lib/keys so it cannot drift. */
  shortcut?: string
  /** Contextual actions (e.g. "Assign 3 selected incidents") are listed first. */
  group?: 'selection' | 'general'
  run: () => void
}

export interface AppState {
  theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void
  density: Density; setDensity: (d: Density) => void; toggleDensity: () => void
  /** Shift being viewed (top-bar switcher). Defaults to the shift active at fixture "now" (PM). */
  shiftId: ShiftId; setShiftId: (s: ShiftId) => void
  toast: (t: ToastInput) => void
  toasts: ToastItem[]; dismissToast: (id: number) => void
  paletteOpen: boolean; setPaletteOpen: (o: boolean) => void
  /** The `?` keyboard shortcut sheet (generated from lib/keys.ts). */
  helpOpen: boolean; setHelpOpen: (o: boolean) => void
  paletteActions: PaletteAction[]
  registerPaletteActions: (a: PaletteAction[]) => () => void
}

const read = (k: string): string | null => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode or blocked storage: keep in-memory only */ } }

const noop = () => {}
const Ctx = createContext<AppState>({
  theme: 'light', setTheme: noop, toggleTheme: noop, density: 'comfortable', setDensity: noop, toggleDensity: noop, shiftId: 'PM', setShiftId: noop,
  toast: noop, toasts: [], dismissToast: noop, paletteOpen: false, setPaletteOpen: noop, helpOpen: false, setHelpOpen: noop, paletteActions: [], registerPaletteActions: () => noop,
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.getAttribute('data-theme') as Theme) || 'light')
  const [density, setDensityState] = useState<Density>(() => (document.documentElement.getAttribute('data-density') as Density) || 'comfortable')
  const [shiftId, setShiftIdState] = useState<ShiftId>(() => (read('plumb.shift') as ShiftId | null) ?? getCurrentShiftId())
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [actionSets, setActionSets] = useState<{ key: number; actions: PaletteAction[] }[]>([])

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); write('plumb.theme', theme) }, [theme])
  useEffect(() => { document.documentElement.setAttribute('data-density', density); write('plumb.density', density) }, [density])
  useEffect(() => { write('plumb.shift', shiftId) }, [shiftId])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random()
    setToasts((l) => [...l.slice(-2), { ...t, id }])
    window.setTimeout(() => dismissToast(id), t.durationMs ?? (t.undo ? 10_000 : 4_000))
  }, [dismissToast])
  const registerPaletteActions = useCallback((actions: PaletteAction[]) => {
    const key = Math.random()
    setActionSets((s) => [...s, { key, actions }])
    return () => setActionSets((s) => s.filter((x) => x.key !== key))
  }, [])

  const value = useMemo<AppState>(() => ({
    theme, setTheme: setThemeState, toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    density, setDensity: setDensityState, toggleDensity: () => setDensityState((d) => (d === 'compact' ? 'comfortable' : 'compact')),
    shiftId, setShiftId: setShiftIdState, toast, toasts, dismissToast, paletteOpen, setPaletteOpen, helpOpen, setHelpOpen,
    paletteActions: actionSets.flatMap((s) => s.actions), registerPaletteActions,
  }), [theme, density, shiftId, toast, toasts, dismissToast, paletteOpen, helpOpen, actionSets, registerPaletteActions])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Theme, density, shift switcher state, toast(), and command-palette plumbing. Safe (no-ops) outside the provider. */
export const useApp = (): AppState => useContext(Ctx)

/** Register contextual palette actions while the calling component is mounted. Pass a memoized array. */
export function usePaletteActions(actions: PaletteAction[]): void {
  const { registerPaletteActions } = useApp()
  useEffect(() => registerPaletteActions(actions), [registerPaletteActions, actions])
}
