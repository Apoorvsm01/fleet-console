import { COPY } from '../lib/copy'
import { useMemo, useRef, useState } from 'react'
import type { CoverageSegment, Shift, ShiftId } from '../data/types'
import { cx } from '../lib/cx'
import { useSimNow } from '../lib/clock'
import { getLead, getOperators, getShifts } from '../lib/queries'
import { DAY_END_MS, DAY_START_MS, fmtTime, ms } from '../lib/time'
import { Kbd } from './ui'

export interface CoverageBarProps {
  /** From getCoverage(). */
  segments: CoverageSegment[]
  /** Lanes to draw, in order. Default: all three shifts. */
  shifts?: Shift[]
  /** Enter on a segment. */
  onOpenShift?: (id: ShiftId) => void
  /** `a` on a segment: open the rota editor / assign cover. */
  onAssign?: (shiftId: ShiftId, seg: CoverageSegment) => void
  selectedShiftId?: ShiftId | null
  className?: string
}
const HOURS = 24
const pct = (t: number) => ((Math.min(Math.max(t, DAY_START_MS), DAY_END_MS) - DAY_START_MS) / (DAY_END_MS - DAY_START_MS)) * 100

/** Gap label that never cuts mid-word: container queries pick the full, mid ("Uncovered") or short ("Gap") form. Full time is in the title and aria-label. */
function GapLabel({ g }: { g: CoverageSegment }) {
  const hrs = Math.round((ms(g.end) - ms(g.start)) / 3600_000)
  return (
    <span className="@container/gap min-w-0 flex-1 text-center" aria-hidden>
      <span className="rounded-xs bg-surface px-1">
        <span className="hidden @min-[16rem]/gap:inline">Uncovered {fmtTime(g.start)}-{fmtTime(g.end)}</span>
        <span className="hidden @min-[7rem]/gap:inline @min-[16rem]/gap:hidden">Uncovered</span>
        <span className="@min-[7rem]/gap:hidden">Gap</span>
      </span>
      <span className="sr-only">{hrs}h</span>
    </span>
  )
}

/**
 * 24h day axis (06:00 to 06:00), one lane per shift with a primary and a backup row. Covered = ink tint with initials; backup = dashed edge; uncovered = hatched with text ("Uncovered 02:00-06:00").
 * A gap is never an empty bar. Keys: arrows move between segments, Enter opens the shift, a assigns cover, t jumps to the segment at "now".
 */
export function CoverageBar({ segments, shifts, onOpenShift, onAssign, selectedShiftId, className }: CoverageBarProps) {
  const lanes = shifts ?? getShifts()
  const now = useSimNow(60_000)
  const ordered = useMemo(() => lanes.flatMap((s) => (['primary', 'backup'] as const).flatMap((r) => segments.filter((g) => g.shiftId === s.id && g.role === r).sort((a, b) => ms(a.start) - ms(b.start)))), [lanes, segments])
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const go = (i: number) => { const n = Math.max(0, Math.min(ordered.length - 1, i)); setActive(n); refs.current[n]?.focus() }

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const g = ordered[i]
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1) }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      const lane = (x: CoverageSegment) => lanes.findIndex((s) => s.id === x.shiftId) * 2 + (x.role === 'backup' ? 1 : 0)
      const target = ordered.map((x, k) => ({ x, k })).filter(({ x }) => lane(x) === lane(g) + dir)
      if (target.length) go(target.reduce((b, c) => (Math.abs(ms(c.x.start) - ms(g.start)) < Math.abs(ms(b.x.start) - ms(g.start)) ? c : b)).k)
    }
    else if (e.key === 'Enter') onOpenShift?.(g.shiftId)
    else if (e.key === 'a') onAssign?.(g.shiftId, g)
    else if (e.key === 't') { const k = ordered.findIndex((x) => ms(x.start) <= now && now < ms(x.end)); if (k >= 0) go(k) }
  }
  const label = (g: CoverageSegment) => {
    if (g.kind === 'uncovered') return `Uncovered ${fmtTime(g.start)}-${fmtTime(g.end)} (${Math.round((ms(g.end) - ms(g.start)) / 3600_000)}h)${g.role === 'backup' ? ', no backup' : ''}`
    const lead = g.leadId ? getLead(g.leadId) : undefined
    return `${lead?.name ?? COPY.unassigned} (${g.role}), ${fmtTime(g.start)}-${fmtTime(g.end)}`
  }
  return (
    <div className={cx('flex flex-col gap-1', className)} role="group" aria-label="Shift coverage, next 24 hours">
      <div className="grid grid-cols-[calc(var(--spacing)*32)_1fr] gap-gap">
        <span />
        <div className="relative h-4 text-xs text-fg-subtle" aria-hidden>
          {Array.from({ length: HOURS / 3 + 1 }, (_, k) => <span key={k} className="mono absolute -translate-x-1/2" style={{ left: `${(k / (HOURS / 3)) * 100}%` }}>{String((6 + k * 3) % 24).padStart(2, '0')}</span>)}
        </div>
      </div>
      <div className="relative flex flex-col gap-1">
      {lanes.map((s) => (
        <div key={s.id} className={cx('grid grid-cols-[calc(var(--spacing)*32)_1fr] items-stretch gap-gap rounded-md', selectedShiftId === s.id && 'bg-surface-selected')}>
          <div className="flex flex-col justify-center px-1">
            <span className="text-base font-medium text-fg">{s.name}</span>
            <span className="text-xs text-fg-subtle">{String(s.startHour).padStart(2, '0')}:00-{String(s.endHour).padStart(2, '0')}:00, {getOperators(s.id).length} operators</span>
          </div>
          <div className="relative flex flex-col gap-1 py-1">
            {(['primary', 'backup'] as const).map((r) => (
              <div key={r} className="relative h-row rounded-sm bg-surface-sunken/60">
                {segments.filter((g) => g.shiftId === s.id && g.role === r).map((g) => {
                  const i = ordered.indexOf(g), past = ms(g.end) <= now, lead = g.leadId ? getLead(g.leadId) : undefined
                  const cls = g.kind === 'uncovered' ? 'hatch-gap text-sev1-fg border border-sev1-line font-semibold'
                    : past ? 'bg-surface-sunken text-fg-subtle border border-line'
                    : cx('bg-accent-subtle text-accent-subtle-fg border-t-2 border-accent', r === 'backup' && 'border-dashed')
                  return (
                    <button key={g.id} ref={(el) => { refs.current[i] = el }} type="button" tabIndex={i === active ? 0 : -1} title={label(g)} aria-label={label(g)}
                      onFocus={() => setActive(i)} onKeyDown={(e) => onKey(e, i)} onClick={() => onOpenShift?.(g.shiftId)}
                      style={{ left: `${pct(ms(g.start))}%`, width: `${pct(ms(g.end)) - pct(ms(g.start))}%` }}
                      className={cx('absolute inset-y-0 flex items-center gap-1 overflow-hidden rounded-sm px-2 text-left text-sm whitespace-nowrap', cls)}>
                      {g.kind === 'uncovered' ? <GapLabel g={g} />
                        : <><b className="font-semibold">{lead?.initials}</b><span className="truncate">{lead?.name}{r === 'backup' ? ' (backup)' : ''}</span></>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-[calc(var(--spacing)*32)_1fr] gap-gap" aria-hidden>
        <span />
        <span className="relative"><span className="absolute inset-y-0 w-px bg-accent" style={{ left: `${pct(now)}%` }} /><span className="absolute top-full -translate-x-1/2 text-xs font-medium text-accent" style={{ left: `${pct(now)}%` }}>now {fmtTime(now)}</span></span>
      </div>
      </div>
      <div className="mt-4 grid grid-cols-[calc(var(--spacing)*32)_1fr] gap-gap">
        <span />
        <p className="flex flex-wrap items-center gap-gap text-xs text-fg-subtle">
          <span><span className="mr-1 inline-block h-2 w-4 border-t-2 border-accent bg-accent-subtle align-middle" />Covered</span>
          <span><span className="mr-1 inline-block h-2 w-4 border-t-2 border-dashed border-accent bg-accent-subtle align-middle" />{COPY.escalation.backup}</span>
          <span><span className="hatch-gap mr-1 inline-block h-2 w-4 border border-sev1-line align-middle" />Uncovered</span>
          <span><span className="mr-1 inline-block h-2 w-4 border border-line bg-surface-sunken align-middle" />Closed</span>
          <span className="ml-auto"><Kbd>t</Kbd> now <Kbd>a</Kbd> assign cover <Kbd>Enter</Kbd> open shift</span>
        </p>
      </div>
    </div>
  )
}
