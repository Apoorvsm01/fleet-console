/**
 * THE key map. Single source of truth for every shortcut in the product.
 * One verb = one key = same meaning on every screen. Screens never type a key letter: they call `useHotkeys({ acknowledge: ... })`
 * or read `keyOf('triage')` for labels / DataTable bulk keys. The `?` sheet, the palette hints and components.md are generated from this.
 */
import { useEffect, useRef } from 'react'
import { NAV_ITEMS } from './nav'

export type VerbId =
  | 'acknowledge' | 'assignMe' | 'reassign' | 'escalate' | 'setSeverity' | 'advance' | 'comment' | 'triage' | 'dismiss'
  | 'handOff' | 'call' | 'openIncident' | 'undo'
export type NavId = 'next' | 'prev' | 'select' | 'open' | 'clear' | 'focusFilter' | 'togglePane'
export type GlobalId = 'palette' | 'help' | 'go'

export interface KeyDef {
  /** Display keys, in order. A chord shows as separate keys ("g" then "n"). */
  keys: string[]
  label: string
  group: 'Global' | 'Go to' | 'List' | 'Verbs'
  /** Extra detail shown in the sheet. */
  note?: string
}

export const VERBS: Record<VerbId, KeyDef> = {
  acknowledge: { keys: ['a'], label: 'Acknowledge', group: 'Verbs', note: 'Escalation: take responsibility' },
  assignMe: { keys: ['m'], label: 'Assign to me', group: 'Verbs', note: 'm = mine' },
  reassign: { keys: ['r'], label: 'Reassign', group: 'Verbs' },
  escalate: { keys: ['e'], label: 'Escalate', group: 'Verbs' },
  setSeverity: { keys: ['1', '2', '3'], label: 'Set severity', group: 'Verbs', note: 'Press 1, 2 or 3. s then 1-3 also works' },
  advance: { keys: ['n'], label: 'Advance status (next step)', group: 'Verbs', note: 'Captured to Triaged to Owned to Resolved to Verified' },
  comment: { keys: ['c'], label: 'Comment', group: 'Verbs' },
  triage: { keys: ['t'], label: 'Mark triaged', group: 'Verbs' },
  dismiss: { keys: ['d'], label: 'Dismiss', group: 'Verbs' },
  handOff: { keys: ['h'], label: 'Hand off', group: 'Verbs', note: 'Escalation to the next lead' },
  call: { keys: ['p'], label: 'Call operator (phone)', group: 'Verbs' },
  openIncident: { keys: ['o'], label: 'Open incident', group: 'Verbs' },
  undo: { keys: ['z'], label: 'Undo last action', group: 'Verbs', note: 'While the Undo toast is showing' },
}
export const LIST_KEYS: Record<NavId, KeyDef> = {
  next: { keys: ['j'], label: 'Next row', group: 'List' },
  prev: { keys: ['k'], label: 'Previous row', group: 'List' },
  select: { keys: ['x'], label: 'Select row', group: 'List', note: 'Space also works. Shift+j/k extends' },
  open: { keys: ['Enter'], label: 'Open / preview', group: 'List', note: 'Shift+Enter opens the full page' },
  clear: { keys: ['Esc'], label: 'Clear selection / close', group: 'List' },
  focusFilter: { keys: ['/'], label: 'Focus filter', group: 'List' },
  togglePane: { keys: ['\\'], label: 'Toggle preview pane', group: 'List' },
}
export const GLOBAL_KEYS: Record<GlobalId, KeyDef> = {
  palette: { keys: ['mod', 'k'], label: 'Command palette', group: 'Global' },
  help: { keys: ['?'], label: 'This shortcut sheet', group: 'Global' },
  go: { keys: ['g'], label: 'Go to... (then a letter)', group: 'Global' },
}
export const GO_KEYS: KeyDef[] = NAV_ITEMS.map((n) => ({ keys: ['g', n.go], label: n.label, group: 'Go to' as const }))

/** Everything, grouped, for the `?` sheet. */
export const ALL_KEYS: KeyDef[] = [...Object.values(GLOBAL_KEYS), ...GO_KEYS, ...Object.values(LIST_KEYS), ...Object.values(VERBS)]

/** The single key character for a verb (first key; severity returns '1'). Use for DataTable bulkActions `key` and for Button `hint`. */
export const keyOf = (v: VerbId): string => VERBS[v].keys[0]

/* ---------- platform notation ---------- */
export const isMac = (): boolean => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
/** One notation everywhere: Command key on Mac, "Ctrl" elsewhere. */
export const fmtKey = (k: string): string => (k === 'mod' ? (isMac() ? '⌘' : 'Ctrl') : k === 'Enter' ? '↵' : k)
/** "⌘K" or "Ctrl K" as one string for tooltips. */
export const fmtCombo = (keys: string[]): string => {
  const mod = isMac()
  return keys.map(fmtKey).join(mod || keys.length === 1 ? '' : ' ')
}

/* ---------- g-chord state shared by the shell and useHotkeys ---------- */
let goArmedAt = 0
export const armGo = (): void => { goArmedAt = Date.now() }
export const disarmGo = (): void => { goArmedAt = 0 }
export const isGoArmed = (): boolean => Date.now() - goArmedAt < 1200

const typing = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  return !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable)
}
const dialogOpen = (): boolean => !!document.querySelector('[aria-modal="true"]')

export type VerbHandlers = Partial<{ [K in Exclude<VerbId, 'setSeverity'>]: () => void | false }> & { setSeverity?: (sev: 1 | 2 | 3) => void | false }

/**
 * Bind verbs for as long as the calling component is mounted. Pass only the verbs that make sense on this screen right now
 * (omit a handler to let the key do nothing). Ignored while typing in a field, while a dialog is open, after `g`, and with modifier keys held.
 * Return `false` from a handler to say "not applicable here" so the key is left alone.
 * `scope` limits the bindings to events inside that element (e.g. a focused card); omit for page-wide.
 * Handlers are read through a ref, so you need not memoize them.
 */
export function useHotkeys(handlers: VerbHandlers, opts: { enabled?: boolean; scope?: React.RefObject<HTMLElement | null> } = {}): void {
  const ref = useRef(handlers)
  ref.current = handlers
  const { enabled = true, scope } = opts
  useEffect(() => {
    if (!enabled) return
    let sevArmed = false
    const h = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || dialogOpen() || isGoArmed()) return
      if (scope?.current && !scope.current.contains(e.target as Node)) return
      const hs = ref.current
      const k = e.key
      if (hs.setSeverity && (k === 's' || (sevArmed && ['1', '2', '3'].includes(k)) || ['1', '2', '3'].includes(k))) {
        if (k === 's') { sevArmed = true; window.setTimeout(() => { sevArmed = false }, 1200); return }
        sevArmed = false
        if (hs.setSeverity(Number(k) as 1 | 2 | 3) !== false) e.preventDefault()
        return
      }
      sevArmed = false
      const id = (Object.keys(VERBS) as VerbId[]).find((v) => v !== 'setSeverity' && VERBS[v].keys[0] === k)
      const fn = id && id !== 'setSeverity' ? hs[id] : undefined
      if (fn && fn() !== false) e.preventDefault()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [enabled, scope])
}
