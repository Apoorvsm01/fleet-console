import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '../lib/cx'
import { useApp, type PaletteAction } from '../lib/app'
import { COPY } from '../lib/copy'
import { fmtKey, GLOBAL_KEYS } from '../lib/keys'
import { NAV_ITEMS } from '../lib/nav'
import { getActiveEscalations, getSearchIndex, type SearchKind } from '../lib/queries'
import { Icon } from './Icon'
import { SeverityChip } from './SeverityChip'
import { Kbd } from './ui'

type Scope = 'all' | SearchKind | 'action'
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'vehicle', label: 'Vehicles' }, { key: 'drive', label: 'Drives' }, { key: 'incident', label: 'Incidents' }, { key: 'operator', label: 'Operators' }, { key: 'action', label: 'Actions' },
]
interface Item { id: string; group: string; title: string; meta?: string; shortcut?: string; icon: string; sev?: 1 | 2 | 3; run: () => void; kind: Scope }

const recent: string[] = [] // in-memory; ids of last opened items

function score(q: string, ...fields: string[]): number {
  if (!q) return 1
  let best = 0
  for (const f of fields) {
    const s = f.toLowerCase()
    if (s === q) best = Math.max(best, 100)
    else if (s.startsWith(q)) best = Math.max(best, 80)
    else if (s.includes(q)) best = Math.max(best, 60)
    else { let i = 0; for (const c of s) if (c === q[i]) i++; if (i === q.length) best = Math.max(best, 20) }
  }
  return best
}

/**
 * Cmd/Ctrl+K anywhere (mounted once in AppShell). Jumps to routes and objects (incident by ID: type "4139", "inc-4139" or "#4139"), runs actions.
 * Tab cycles scope; `>` actions only; `#` incidents; `@` people. Register contextual actions with usePaletteActions().
 */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setHelpOpen, paletteActions, toggleTheme, toggleDensity } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [hi, setHi] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(!paletteOpen) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [paletteOpen, setPaletteOpen])
  useEffect(() => {
    if (paletteOpen) { returnTo.current = document.activeElement as HTMLElement; setQ(''); setScope('all'); setHi(0); window.setTimeout(() => input.current?.focus(), 0) }
    else returnTo.current?.focus?.()
  }, [paletteOpen])

  const close = () => setPaletteOpen(false)
  const go = (to: string, id?: string) => { if (id) { const i = recent.indexOf(id); if (i >= 0) recent.splice(i, 1); recent.unshift(id); recent.length = Math.min(recent.length, 5) } nav(to); close() }

  const items = useMemo<Item[]>(() => {
    let query = q.trim().toLowerCase(), sc = scope
    if (query.startsWith('>')) { sc = 'action'; query = query.slice(1).trim() }
    else if (query.startsWith('#')) { sc = 'incident'; query = query.slice(1).trim() }
    else if (query.startsWith('@')) { sc = 'operator'; query = query.slice(1).trim() }
    const base: Item[] = []
    const sel = paletteActions.filter((a) => a.group === 'selection')
    const act: PaletteAction[] = [...sel, ...paletteActions.filter((a) => a.group !== 'selection'),
      ...getActiveEscalations().map((v): PaletteAction => ({ id: `a-esc-${v.escalation.id}`, title: `${v.isMine ? COPY.escalation.review : COPY.escalation.view} escalation ${v.escalation.id}`, meta: v.incident.title, run: () => nav(`/escalations/${v.escalation.id}`) })),
      { id: 'a-help', title: 'Show keyboard shortcuts', shortcut: GLOBAL_KEYS.help.keys.join(' '), run: () => setHelpOpen(true) },
      { id: 'a-theme', title: 'Toggle light / dark theme', run: toggleTheme }, { id: 'a-density', title: 'Toggle comfortable / compact density', run: toggleDensity }]
    act.forEach((a) => base.push({ id: a.id, group: a.group === 'selection' ? 'Actions on selection' : 'Actions', title: a.title, meta: a.meta, shortcut: a.shortcut, icon: 'command', kind: 'action', run: () => { a.run(); close() } }))
    NAV_ITEMS.forEach((n) => base.push({ id: `n-${n.key}`, group: 'Go to', title: n.label, shortcut: `g ${n.go}`, icon: n.icon, kind: 'all', run: () => go(n.to) }))
    getSearchIndex().forEach((h) => base.push({ id: h.id, group: h.kind === 'incident' ? 'Incidents' : h.kind === 'vehicle' ? 'Vehicles' : h.kind === 'drive' ? 'Drives' : 'People', title: h.title, meta: `${h.id !== h.title ? `${h.id} · ` : ''}${h.meta}`, icon: h.kind === 'incident' ? 'alert' : h.kind === 'vehicle' ? 'car' : h.kind === 'drive' ? 'map' : 'user', sev: h.sev, kind: h.kind, run: () => go(h.to, h.id) }))
    const qn = query.replace(/^inc-?/, 'inc-')
    const scored = base
      .filter((b) => sc === 'all' || b.kind === sc || (sc === 'action' && b.kind === 'action'))
      .filter((b) => sc !== 'all' || query || b.kind === 'action' || b.group === 'Go to' || recent.includes(b.id) || b.group === 'Actions on selection')
      .map((b) => ({ b, s: b.group === 'Actions on selection' && !query ? 200 : score(qn, b.id, b.title, b.meta ?? '') * 1 + (recent.includes(b.id) ? 10 : 0) }))
      .filter((x) => x.s > 0)
    const order = ['Actions on selection', 'Go to', 'Incidents', 'Vehicles', 'Drives', 'People', 'Actions']
    const out = scored.sort((a, b) => order.indexOf(a.b.group) - order.indexOf(b.b.group) || b.s - a.s).map((x) => x.b)
    const capped: Item[] = [], seen: Record<string, number> = {}
    out.forEach((i) => { seen[i.group] = (seen[i.group] ?? 0) + 1; if (sc !== 'all' || seen[i.group] <= 6) capped.push(i) })
    if (!query && sc === 'all') {
      const r = recent.map((id) => base.find((b) => b.id === id)).filter(Boolean).map((b) => ({ ...b!, group: 'Recent' }))
      return [...r, ...capped.filter((c) => c.group === 'Actions on selection' || c.group === 'Go to' || c.group === 'Actions')]
    }
    return capped
  }, [q, scope, paletteActions, toggleTheme, toggleDensity, setHelpOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!paletteOpen) return null
  const idx = Math.min(hi, Math.max(0, items.length - 1))
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); setHi(Math.min(idx + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); setHi(Math.max(idx - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[idx]?.run() }
    else if (e.key === 'Tab') { e.preventDefault(); const k = SCOPES.findIndex((s) => s.key === scope); setScope(SCOPES[(k + (e.shiftKey ? SCOPES.length - 1 : 1)) % SCOPES.length].key); setHi(0) }
  }
  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-scrim pt-24 anim-fade" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey} className="flex max-h-[calc(100vh-var(--spacing)*32)] w-palette flex-col overflow-hidden rounded-lg bg-surface-raised shadow-3">
        <div className="flex items-center gap-2 border-b border-line px-pad focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-focus">
          <Icon name="search" className="text-fg-subtle" />
          <input ref={input} role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={items[idx] ? `pal-${items[idx].id}` : undefined} aria-label="Search"
            value={q} onChange={(e) => { setQ(e.target.value); setHi(0) }} placeholder="Jump to incident 4139, vehicle, person, or run an action"
            className="h-topbar flex-1 bg-transparent text-md text-fg outline-none placeholder:text-fg-subtle" />
          <Kbd>Esc</Kbd>
        </div>
        <div className="flex gap-1 border-b border-line px-pad py-2" role="tablist" aria-label="Scope">
          {SCOPES.map((s) => (
            <button key={s.key} role="tab" type="button" aria-selected={scope === s.key} onClick={() => { setScope(s.key); setHi(0); input.current?.focus() }} tabIndex={-1}
              className={cx('h-chip rounded-sm px-2 text-sm', scope === s.key ? 'bg-accent-subtle font-medium text-accent-subtle-fg' : 'text-fg-muted hover:bg-surface-hover')}>{s.label}</button>
          ))}
        </div>
        <ul id="palette-list" role="listbox" className="min-h-0 flex-1 overflow-auto p-1">
          {items.length === 0 && <li className="px-pad py-6 text-center text-base text-fg-muted">No match. Try an incident number like 4139, or <Kbd>g</Kbd> <Kbd>n</Kbd> shortcuts.</li>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null
            lastGroup = it.group
            return (
              <li key={`${it.group}-${it.id}`} role="presentation">
                {head && <div className="caps px-2 pt-2 pb-1 text-fg-subtle">{head}</div>}
                <div id={`pal-${it.id}`} role="option" aria-selected={i === idx} onMouseMove={() => setHi(i)} onClick={() => it.run()}
                  className={cx('flex h-row cursor-pointer items-center gap-gap rounded-sm px-2', i === idx ? 'bg-surface-selected' : '')}>
                  {it.sev ? <SeverityChip sev={it.sev} dot /> : <Icon name={it.icon} className="text-fg-muted" />}
                  <span className="min-w-0 flex-1 truncate text-base text-fg">{it.title}</span>
                  {it.meta && <span className="max-w-64 truncate text-sm text-fg-subtle">{it.meta}</span>}
                  {it.shortcut && <span className="flex gap-px">{it.shortcut.split(' ').map((k) => <Kbd key={k}>{fmtKey(k)}</Kbd>)}</span>}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center gap-gap border-t border-line px-pad py-2 text-sm text-fg-subtle">
          <span><Kbd>Up</Kbd> <Kbd>Down</Kbd> move</span><span><Kbd>Enter</Kbd> run</span><span><Kbd>Tab</Kbd> scope</span><span><Kbd>&gt;</Kbd> actions <Kbd>#</Kbd> incident <Kbd>@</Kbd> person</span>
        </div>
      </div>
    </div>
  )
}
