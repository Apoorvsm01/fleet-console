import { Icon } from '../../components'
import { cx } from '../../lib/cx'
import { COPY } from '../../lib/copy'
import { SPAN_BASELINE, getNow } from '../../lib/queries'
import { useStore } from '../../lib/store'
import { DAY_END_MS, DAY_START_MS, fmtNum, fmtTime, ms } from '../../lib/time'
import { useSimNow } from '../../lib/clock'
import { Divider, Group, Screen, useIosNav } from './parts'

const pct = (t: number) => Math.max(0, Math.min(100, ((t - DAY_START_MS) / (DAY_END_MS - DAY_START_MS)) * 100))

export default function NowTab() {
  useStore()
  const now = useSimNow(15000)
  const { go } = useIosNav()
  const n = getNow()
  const d = n.debt.current
  const prog = n.programDebt
  const shiftName = COPY.shiftName[n.shift.id]
  const mine = n.escalations.filter((v) => v.isMine && v.active)
  const rows: { label: string; value: number }[] = [
    { label: COPY.debt.footageLong, value: d.unreviewedFootage },
    { label: COPY.debt.triage, value: d.openIncidents },
    { label: COPY.debt.rerouted, value: d.staleEscalations },
    { label: COPY.debt.gapsLong, value: d.uncoveredGaps },
  ]
  const primary = n.coverage.filter((c) => c.role === 'primary')
  const backup = n.coverage.filter((c) => c.role === 'backup')
  const gaps = n.gaps
  return (
    <Screen title="Now" tab="now" subtitle={`${shiftName} shift, ${String(n.shift.startHour).padStart(2, '0')}:00 to ${String(n.shift.endHour).padStart(2, '0')}:00 UTC`}>
      {mine.length > 0 && (
        <section className="mt-2 px-pane">
          <button type="button" onClick={() => go(`esc/${mine[0].escalation.id}`)} className="ios-press flex w-full items-center gap-gap rounded-lg border border-sev1-line bg-surface p-pad text-left">
            <Icon name="alert" className="text-sev1-mark" />
            <span className="flex-1 text-base font-semibold text-fg">{mine.length} escalation{mine.length === 1 ? '' : 's'} need{mine.length === 1 ? 's' : ''} you</span>
            <Icon name="right" className="text-fg-subtle" />
          </button>
        </section>
      )}

      <section className="mt-4 px-pane" aria-labelledby="debt">
        <h2 id="debt" className="caps px-2 pb-1.5 text-fg-muted">Oversight debt</h2>
        <div className="rounded-lg bg-surface p-pad">
          <div className="flex items-end justify-between gap-gap">
            <div>
              <p className={cx('t-largetitle font-bold', d.total === 0 ? 'text-fg' : 'text-fg')} aria-label={`${fmtNum(d.total)} total`}>{d.total === 0 ? 'Clear' : fmtNum(d.total)}</p>
              <p className="t-subhead text-fg-muted">on this shift</p>
            </div>
            <p className="max-w-40 text-right text-sm text-fg-muted">Program-wide {fmtNum(prog.current.total)}{prog.previous ? `, ${fmtNum(prog.previous.total)} last shift` : ''}</p>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {rows.map((r) => (
              <li key={r.label} className="flex flex-col rounded-md bg-surface-sunken p-pad">
                <span className="text-xl font-semibold text-fg" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.value === 0 ? <span className="flex items-center gap-1 text-md"><Icon name="check" className="text-status-done" />Clear</span> : fmtNum(r.value)}</span>
                <span className="text-sm text-fg-muted">{r.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-fg-subtle">The total is the plain sum of the four counts.</p>
        </div>
      </section>

      <section className="mt-4 px-pane" aria-labelledby="cov">
        <h2 id="cov" className="caps px-2 pb-1.5 text-fg-muted">My shift coverage</h2>
        <div className="rounded-lg bg-surface p-pad">
          <div className="flex flex-col gap-2">
            <Lane label="Primary" segs={primary} now={now} />
            <Lane label="Backup" segs={backup} now={now} />
            <div className="relative h-4 text-xs text-fg-subtle" aria-hidden>
              {[6, 12, 18, 24, 30].map((h) => <span key={h} className="absolute -translate-x-1/2 font-mono" style={{ left: `${((h - 6) / 24) * 100}%` }}>{String(h % 24).padStart(2, '0')}</span>)}
            </div>
          </div>
          {gaps.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-base text-fg"><Icon name="check" className="text-status-done" />No gaps on this shift.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {gaps.map((g) => (
                <li key={g.id} className="flex items-start gap-2 rounded-md bg-sev1-bg p-2 text-base text-sev1-fg">
                  <Icon name="alert" className="mt-0.5" />
                  <span><strong className="font-semibold">{g.role === 'primary' ? 'No primary' : 'No backup'}:</strong> uncovered {fmtTime(g.start)} to {fmtTime(g.end)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Group title="Span of control" footer={`Baseline is ${SPAN_BASELINE} operators per lead.`}>
        {n.spans.map((s, i) => (
          <div key={s.lead.id}>
            {i > 0 && <Divider />}
            <div className="flex min-h-row items-center justify-between gap-gap p-pad">
              <div className="min-w-0">
                <p className="truncate text-md font-medium text-fg" title={s.lead.name}>{s.lead.name}</p>
                <p className="text-sm text-fg-muted">{s.lead.role} · {COPY.reach[s.lead.reachable]}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-fg" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.span}</p>
                <p className={cx('text-sm', s.overBaseline ? 'font-semibold text-sev2-fg' : 'text-fg-muted')}>{s.overBaseline ? `Over by ${s.span - SPAN_BASELINE}` : s.span === 0 ? 'No operators' : 'operators'}</p>
              </div>
            </div>
          </div>
        ))}
      </Group>
    </Screen>
  )
}

function Lane({ label, segs, now }: { label: string; segs: ReturnType<typeof getNow>['coverage']; now: number }) {
  const nowPct = pct(now)
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-sm text-fg-muted">{label}</span>
      <div className="relative h-6 flex-1 overflow-hidden rounded-xs bg-track">
        {segs.map((c) => {
          const l = pct(ms(c.start)); const r = pct(ms(c.end))
          const gap = c.kind === 'uncovered'
          return <span key={c.id} role="img" aria-label={`${label} ${gap ? 'uncovered' : 'covered'} ${fmtTime(c.start)} to ${fmtTime(c.end)}`} title={`${fmtTime(c.start)} to ${fmtTime(c.end)}`}
            className={cx('absolute inset-y-0', gap ? 'hatch-gap border-x border-sev1-line' : 'bg-status-on')} style={{ left: `${l}%`, width: `${r - l}%` }} />
        })}
        <span aria-hidden className="absolute inset-y-0 w-(--spacing-bar) bg-accent" style={{ left: `${nowPct}%` }} />
      </div>
    </div>
  )
}
