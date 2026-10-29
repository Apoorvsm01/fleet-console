import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from '../lib/app'
import { cx } from '../lib/cx'
import { useSimNow } from '../lib/clock'
import { applyDemoFromLocation } from '../lib/demo'
import { COPY } from '../lib/copy'
import { armGo, disarmGo, isGoArmed, keyOf } from '../lib/keys'
import { NAV_ITEMS } from '../lib/nav'
import { getActiveEscalations, getCurrentShiftId, getCurrentUser, getGaps, getNavCounts, getSavedViews, getShifts } from '../lib/queries'
import { useStore } from '../lib/store'
import { fmtCountdown, fmtTime, ms } from '../lib/time'
import type { QueueId, ShiftId } from '../data/types'
import { CommandPalette } from './CommandPalette'
import { KeyboardSheet } from './KeyboardSheet'
import { Icon } from './Icon'
import { SeverityChip } from './SeverityChip'
import { Avatar, Button, IconButton, KeyCombo } from './ui'

function Banner() {
  useStore()
  const now = useSimNow(1000)
  const esc = getActiveEscalations()
  const loc = useLocation()
  // Now already shows full cards, and an escalation's own page is the card: repeating them in the banner is the duplication the UX critique flagged.
  const rows = esc.filter((v) => loc.pathname !== `/escalations/${v.escalation.id}`)
  if (!rows.length || loc.pathname === '/now') return null
  return (
    <section role="region" aria-label="Escalation alerts" className="flex flex-col border-b border-sev1-line bg-sev1-bg text-sev1-fg">
      {rows.map((v) => {
        const rem = v.escalation.deadline ? ms(v.escalation.deadline) - now : 0
        return (
          <div key={v.escalation.id} className="flex min-h-row items-center gap-gap px-pane py-1">
            <SeverityChip sev={v.incident.sev} />
            <span className="mono text-sm">{v.escalation.id}</span>
            <span className="min-w-0 truncate text-base font-medium" title={v.incident.title}>{v.incident.title}</span>
            <span className="shrink-0 text-sm">{v.rerouted ? `${COPY.escalation.rerouted} after no answer. ${v.current.id === getCurrentUser().id ? 'You must acknowledge' : `Waiting on ${v.current.name}`}` : `Waiting on ${v.current.name}`}</span>
            <span className="mono ml-auto shrink-0 text-md font-semibold tnum" title="Time until re-route">{fmtCountdown(rem)}</span>
            <Link to={`/escalations/${v.escalation.id}`} className="inline-flex h-ctl min-w-hit shrink-0 items-center rounded-sm border border-sev1-line px-pad text-base font-medium underline">{v.isMine ? COPY.escalation.review : COPY.escalation.view}</Link>
          </div>
        )
      })}
    </section>
  )
}

function ShiftSwitcher() {
  const { shiftId, setShiftId } = useApp()
  const cur = getCurrentShiftId()
  const gaps = (id: ShiftId) => getGaps(id).filter((g) => g.role === 'primary').length
  return (
    <div role="radiogroup" aria-label="Shift being viewed" title="Shift being viewed" className="flex items-center rounded-sm border border-line-strong bg-surface p-px">
      {getShifts().map((s) => {
        const on = s.id === shiftId
        return (
          <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => setShiftId(s.id)}
            className={cx('inline-flex h-ctl items-center gap-1 rounded-xs px-pad text-base', on ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:bg-surface-hover')}>
            {s.name}
            {s.id === cur && <span className={cx('text-xs', on ? 'text-fg-on-accent' : 'text-fg-subtle')}>now</span>}
            {gaps(s.id) > 0 && <span className={cx('hatch-gap inline-block size-3 border', on ? 'border-fg-on-accent' : 'border-sev1-line')} title={`${s.name} has an uncovered gap`} aria-label="has uncovered gap" role="img" />}
          </button>
        )
      })}
    </div>
  )
}

function Nav() {
  useStore()
  const counts = getNavCounts()
  const pinned = (['inbox', 'owned', 'review', 'fleet'] as QueueId[]).flatMap((q) => getSavedViews(q).filter((v) => v.pinned && v.query).map((v) => ({ q, v })))
  return (
    <nav aria-label="Primary" className="flex w-nav shrink-0 flex-col gap-gap border-r border-line bg-surface p-pad">
      <Link to="/now" className="flex items-center gap-2 px-2 py-1 text-md font-semibold text-fg"><span className="flex size-6 items-center justify-center rounded-md bg-accent text-fg-on-accent"><Icon name="fleet" /></span>Fleet Console</Link>
      <ul className="flex flex-col gap-px">
        {NAV_ITEMS.map((n) => {
          const c = counts[n.key]
          // Badges only where something needs a person. Fleet and Plan counts are state, not work, so they show none (D-NEW).
          const badge = n.key !== 'fleet' && n.key !== 'plan'
          const what = { now: 'escalations and gaps need you', inbox: 'to triage', owned: 'owned by you', review: 'to review' }[n.key as 'now' | 'inbox' | 'owned' | 'review']
          return (
            <li key={n.key}>
              <NavLink to={n.to} className={({ isActive }) => cx('group flex h-ctl items-center gap-2 rounded-sm px-2 text-base', 'relative', isActive ? 'bg-surface-selected font-medium text-fg before:absolute before:inset-y-0 before:left-0 before:w-bar before:bg-accent' : 'text-fg-muted hover:bg-surface-hover')}>
                <Icon name={n.icon} />
                <span className="flex-1">{n.label}</span>
                <span className="hidden group-hover:inline-flex group-focus-visible:inline-flex"><KeyCombo keys={['g', n.go]} /></span>
                {badge && (
                  <span className={cx('mono min-w-6 text-right text-sm', c === 0 ? 'text-fg-subtle' : 'text-fg')} title={`${c.toLocaleString('en-US')} ${what}`}>
                    <span aria-hidden>{c === 0 ? <Icon name="check" className="inline size-3" /> : c.toLocaleString('en-US')}</span>
                    <span className="sr-only">{c.toLocaleString('en-US')} {what}</span>
                  </span>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
      <div>
        <h2 className="caps px-2 pb-1 text-fg-subtle">Pinned views</h2>
        <ul className="flex flex-col gap-px">
          {pinned.map(({ q, v }) => (
            <li key={v.id}><Link to={`/${q}?view=${v.id}&q=${encodeURIComponent(v.query)}`} className="block truncate rounded-sm px-2 py-1 text-base text-fg-muted hover:bg-surface-hover" title={v.name}>{v.name}</Link></li>
          ))}
        </ul>
      </div>
      <p className="mt-auto px-2 text-xs text-fg-subtle">Fixture data. Times in UTC.</p>
    </nav>
  )
}

function TopBar() {
  const { theme, toggleTheme, density, toggleDensity, setPaletteOpen, setHelpOpen } = useApp()
  const me = getCurrentUser()
  const now = useSimNow(30_000)
  return (
    <header className="flex h-topbar shrink-0 items-center gap-gap border-b border-line bg-surface px-pane">
      <ShiftSwitcher />
      <span className="mono text-sm text-fg-subtle">{fmtTime(now)} UTC</span>
      <button type="button" onClick={() => setPaletteOpen(true)} className="ml-auto flex h-ctl w-search items-center gap-2 rounded-sm border border-line-strong bg-surface px-pad text-base text-fg-subtle hover:bg-surface-hover">
        <Icon name="search" /><span className="flex-1 text-left">Search or jump to...</span><KeyCombo keys={['mod', 'k']} />
      </button>
      <IconButton label={`Theme: ${theme}. Switch to ${theme === 'dark' ? 'light' : 'dark'}`} onClick={toggleTheme}><Icon name={theme === 'dark' ? 'moon' : 'sun'} /></IconButton>
      <IconButton label="Keyboard shortcuts" onClick={() => setHelpOpen(true)}><Icon name="keyboard" /></IconButton>
      <Button variant="ghost" onClick={toggleDensity} aria-pressed={density === 'compact'} title={`Row density: ${density}. Switch to ${density === 'compact' ? 'comfortable' : 'compact'}`} icon={<Icon name="density" />}>{density === 'compact' ? 'Compact' : 'Comfortable'}</Button>
      <div className="flex items-center gap-2 border-l border-line pl-gap"><Avatar initials={me.initials} /><div className="leading-tight"><p className="text-base text-fg">{me.name}</p><p className="text-xs text-fg-subtle">PM backup lead</p></div></div>
    </header>
  )
}

function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="fixed right-4 bottom-4 z-60 flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="anim-slide flex items-center gap-gap rounded-lg bg-surface-raised px-pad py-2 shadow-2">
          <span className="text-base text-fg">{t.message}</span>
          {t.undo && <Button variant="secondary" hint={keyOf('undo')} onClick={() => { t.undo!(); dismissToast(t.id) }}>Undo</Button>}
          <IconButton label="Dismiss" onClick={() => dismissToast(t.id)}><Icon name="x" /></IconButton>
        </div>
      ))}
    </div>
  )
}

/** Global keys: g + letter navigation, `?` sheet, and `z` to run the newest Undo toast. All keys come from lib/keys.ts. */
function GlobalKeys() {
  const nav = useNavigate()
  const { toasts, dismissToast, setHelpOpen } = useApp()
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable) return
      if (document.querySelector('[aria-modal="true"]')) return
      if (e.key === '?') { e.preventDefault(); setHelpOpen(true); return }
      if (isGoArmed()) {
        const item = NAV_ITEMS.find((n) => n.go === e.key)
        disarmGo()
        if (item) { e.preventDefault(); nav(item.to) }
        return
      }
      if (e.key === 'g') { armGo(); return }
      if (e.key === keyOf('undo')) {
        const u = [...toasts].reverse().find((x) => x.undo)
        if (u) { e.preventDefault(); u.undo!(); dismissToast(u.id) }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [nav, toasts, dismissToast, setHelpOpen])
  return null
}

function Shell() {
  const loc = useLocation()
  applyDemoFromLocation(loc.pathname, loc.search) // before children render, so ?demo=acked has no flash
  return (
    <div className="flex h-full min-w-page-min bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-60 focus:bg-surface focus:p-2">Skip to content</a>
      <Nav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <Banner />
        <main id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-auto"><Outlet /></main>
      </div>
      <CommandPalette />
      <KeyboardSheet />
      <Toasts />
      <GlobalKeys />
    </div>
  )
}

/** Route layout. Provides AppProvider (theme, density, shift, toasts, palette) around nav, top bar, escalation banner, and the routed screen. Screens render into <main> (flex column, scrolls): give your root `flex min-h-0 flex-1 flex-col`. */
export default function AppShell() {
  return <AppProvider><Shell /></AppProvider>
}
