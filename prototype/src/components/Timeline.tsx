import { useRef, useState, type ReactNode } from 'react'
import type { Sev, TimelineEvent } from '../data/types'
import { cx } from '../lib/cx'
import { fmtDateTime, fmtDay, fmtRel, fmtTime, FIXTURE_NOW } from '../lib/time'
import { SeverityChip } from './SeverityChip'
import { StatusMarker } from './StatusMarker'

export interface TimelineProps {
  /** Newest first (what getTimeline returns). */
  events: TimelineEvent[]
  /** feed = cards with day separators; compact = one line per event. */
  variant?: 'feed' | 'compact'
  selectedId?: string | null
  /** Click or Enter. Use it to highlight the linked map point (event.mapId). */
  onSelect?: (e: TimelineEvent) => void
  /** `m` key: reveal this event on the map. */
  onReveal?: (e: TimelineEvent) => void
  /** Extra content shown under an expanded event (telemetry, clip). Events with this return value become expandable. */
  renderExpanded?: (e: TimelineEvent) => ReactNode
  /** Show the "now" marker at the top (default true). */
  showNow?: boolean
  loading?: boolean
  emptyLabel?: string
  ariaLabel?: string
  className?: string
}

function Node({ e }: { e: TimelineEvent }) {
  if (e.sev) return <SeverityChip sev={e.sev} dot />
  return <span aria-hidden className="size-2 rounded-full bg-fg-subtle" />
}

/** Vertical event feed for Incident tags/events, drive history, audit trail. Keys: j/k between events, Enter expand, m reveal on map, [ ] previous/next day, Home/End. */
export function Timeline({ events, variant = 'feed', selectedId, onSelect, onReveal, renderExpanded, showNow = true, loading, emptyLabel = 'No events yet', ariaLabel = 'Timeline', className }: TimelineProps) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const refs = useRef<(HTMLLIElement | null)[]>([])
  const focusIdx = (i: number) => { const n = Math.max(0, Math.min(events.length - 1, i)); setActive(n); refs.current[n]?.focus() }
  const dayOf = (t: string) => t.slice(0, 10)
  if (loading) return <ul aria-busy className={cx('flex flex-col gap-gap p-pane', className)}>{[0, 1, 2].map((i) => <li key={i} className="h-row rounded-sm bg-surface-sunken" />)}</ul>
  if (!events.length) return <p className="p-pane text-base text-fg-muted">{emptyLabel}</p>

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return
    const ev = events[i]
    if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); focusIdx(i + 1) }
    else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); focusIdx(i - 1) }
    else if (e.key === 'Home') { e.preventDefault(); focusIdx(0) }
    else if (e.key === 'End') { e.preventDefault(); focusIdx(events.length - 1) }
    else if (e.key === 'Enter') { e.preventDefault(); onSelect?.(ev); if (renderExpanded) setOpen((s) => { const n = new Set(s); if (n.has(ev.id)) n.delete(ev.id); else n.add(ev.id); return n }) }
    else if (e.key === 'm') onReveal?.(ev)
    else if (e.key === ']' || e.key === '[') {
      const d = dayOf(ev.at); const dir = e.key === ']' ? -1 : 1 // newest first: "next day" is earlier in the list order reversed
      let k = i + dir
      while (k >= 0 && k < events.length && dayOf(events[k].at) === d) k += dir
      if (k >= 0 && k < events.length) focusIdx(k)
    }
  }
  return (
    <ul role="list" aria-label={ariaLabel} className={cx('flex flex-col', className)}>
      {showNow && (
        <li aria-hidden className="flex items-center gap-gap px-pane py-1 text-xs text-fg-subtle">
          <span className="mono w-16 text-right">{fmtTime(FIXTURE_NOW)}</span><span className="h-px flex-1 bg-accent" /><span className="caps text-accent">Now</span>
        </li>
      )}
      {events.map((ev, i) => {
        const newDay = i === 0 || dayOf(events[i - 1].at) !== dayOf(ev.at)
        const isOpen = open.has(ev.id)
        return (
          <li key={ev.id} role="listitem" className="list-none">
            {newDay && <div className="caps px-pane pt-2 pb-1 text-fg-subtle">{fmtDay(ev.at)}</div>}
            <div ref={(el) => { refs.current[i] = el as unknown as HTMLLIElement }} tabIndex={i === active ? 0 : -1} aria-expanded={renderExpanded ? isOpen : undefined}
              onKeyDown={(e) => onKey(e, i)} onFocus={(e) => { if (e.target === e.currentTarget) setActive(i) }} onClick={() => { setActive(i); onSelect?.(ev) }}
              className={cx('grid cursor-default grid-cols-[calc(var(--spacing)*16)_calc(var(--spacing)*4)_1fr] items-start gap-gap px-pane outline-none hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                variant === 'compact' ? 'py-0.5' : 'py-2', selectedId === ev.id && 'bg-surface-selected')}>
              <time dateTime={ev.at} title={fmtDateTime(ev.at)} className="mono text-right text-sm text-fg-subtle">{fmtRel(ev.at)}</time>
              <span className="flex h-5 items-center justify-center"><Node e={ev} /></span>
              <div className="min-w-0">
                <p className="text-base text-fg">
                  <span className="font-medium">{ev.actor ?? 'System'}</span> {ev.verb}{ev.object ? <> <span className="font-medium">{ev.object}</span></> : null}
                  {ev.sev && variant === 'feed' && <span className="ml-2 align-middle"><SeverityChip sev={ev.sev as Sev} /></span>}
                  {ev.status && <span className="ml-2 align-middle"><StatusMarker status={ev.status} variant="compact" /></span>}
                </p>
                {variant === 'feed' && ev.detail && <p className="text-sm text-fg-muted">{ev.detail}</p>}
                {isOpen && renderExpanded && <div className="mt-2 rounded-md border border-line bg-surface-sunken p-pad">{renderExpanded(ev)}</div>}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export interface DriveStripProps {
  /** Tags positioned 0..1 along the drive. */
  tags: { id: string; pos: number; sev: Sev; label: string }[]
  /** ODD segment bands 0..1. */
  bands?: { from: number; to: number; label: string }[]
  selectedId?: string | null
  onSelect?: (id: string) => void
}
/** Horizontal drive strip: tags along the drive with ODD bands underneath. Each tag is a button (Tab / Enter). */
export function DriveStrip({ tags, bands = [], selectedId, onSelect }: DriveStripProps) {
  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Drive strip">
      <div className="relative h-6">
        <span className="absolute inset-x-0 top-1/2 h-px bg-fg-subtle" />
        {tags.map((t) => (
          <button key={t.id} type="button" onClick={() => onSelect?.(t.id)} aria-label={`${t.label}, SEV${t.sev}`} title={t.label} style={{ left: `${t.pos * 100}%` }}
            className={cx('absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-surface p-px', selectedId === t.id && 'outline-2 outline-focus')}>
            <SeverityChip sev={t.sev} dot />
          </button>
        ))}
      </div>
      <div className="relative h-4">
        {bands.map((b) => <span key={b.label} style={{ left: `${b.from * 100}%`, width: `${(b.to - b.from) * 100}%` }} className="absolute inset-y-0 truncate rounded-xs bg-surface-sunken px-1 text-xs text-fg-muted">{b.label}</span>)}
      </div>
    </div>
  )
}
