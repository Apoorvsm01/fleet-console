import { useNavigate } from 'react-router-dom'
import { CoverageBar, EmptyState, EscalationCard, MetricTile } from '../components'
import { Button } from '../components/ui'
import { acknowledgeEscalation, handOffEscalation, useStore } from '../lib/store'
import { getCoverage, getCurrentUser, getEscalations, getInbox, getNow, getShifts } from '../lib/queries'
import { fmtTime } from '../lib/time'
import { COPY } from '../lib/copy'
import { useSimNow } from '../lib/clock'
import { SpanPanel } from './now/SpanPanel'

export default function NowScreen() {
  useStore()
  const nav = useNavigate()
  const simNow = useSimNow(1000)
  const me = getCurrentUser()
  const now = getNow()
  const { current, previous, history } = now.programDebt
  const prev = previous
  const delta = (cur: number, p?: number) => (p === undefined ? undefined : { value: cur - p, text: 'vs last shift' })
  const active = now.escalations
  const stale = getEscalations().filter((e) => e.escalation.state === 'Timed out')
  const gapCount = current.uncoveredGaps
  const gap = now.gaps.find((g) => g.role === 'primary') ?? now.gaps[0]
  const gapShift = gap ? getShifts().find((s) => s.id === gap.shiftId)?.name : undefined
  const gapText = gap ? `Uncovered ${fmtTime(gap.start)}-${fmtTime(gap.end)} UTC · ${gapShift} shift` : 'No uncovered windows'
  // D-NEW: escalations stack full-width (primary full card, then compact rows) so coverage and span sit higher.
  // D-NEW: the tile counts exactly the rows /inbox?scope=team&q=kind:incident lists (Captured + Triaged), not Owned.
  const toTriage = getInbox('team').filter((r) => r.kind === 'incident').length
  const heroTotal = current.unreviewedFootage + toTriage + current.staleEscalations + gapCount
  const mine = active.filter((v) => v.isMine)
  const others = active.filter((v) => !v.isMine)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-pane overflow-auto p-pane">
      <header className="flex items-end gap-gap">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-fg">Now</h1>
          <p className="text-md text-fg-muted">
            {now.shift.name} shift · {me.name}, {me.role.toLowerCase()} lead · <span className="font-mono tabular-nums">{fmtTime(new Date(simNow).toISOString())} UTC</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={() => nav('/plan')}>Open plan</Button>
          <Button variant="secondary" onClick={() => nav('/inbox')} hint="g i">Open inbox</Button>
        </div>
      </header>

      <section aria-label="Escalations needing a lead" className="flex flex-col gap-2">
        <h2 className="caps text-fg-muted">
          Active escalations <span className="tabular-nums text-fg-subtle">· {active.length}</span>
        </h2>
        {active.length === 0 ? (
          <EmptyState variant="success" title="No active escalations" description="Nothing is waiting on a lead right now." />
        ) : (
          <div className="flex flex-col gap-gap">
            {mine.map((v) => (
              <EscalationCard key={v.escalation.id} view={v} variant="full" onAcknowledge={() => acknowledgeEscalation(v.escalation.id)} onHandOff={(to) => handOffEscalation(v.escalation.id, to)} />
            ))}
            {others.map((v) => (
              <EscalationCard key={v.escalation.id} view={v} variant="compact" onAcknowledge={() => acknowledgeEscalation(v.escalation.id)} onTakeOver={() => acknowledgeEscalation(v.escalation.id)} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Coverage and span" className="grid grid-cols-12 items-stretch gap-gap">
        <div className="col-span-8 flex min-w-0 flex-col gap-gap">
          <h2 className="caps text-fg-muted">
            Coverage · 24h{gap ? <span className="normal-case text-fg"> · {gapText}</span> : null}
          </h2>
          <CoverageBar segments={getCoverage()} onOpenShift={(id) => nav(`/plan?shift=${id}`)} onAssign={(id) => nav(`/plan?shift=${id}`)} />
        </div>
        <div className="col-span-4 flex min-w-0 flex-col gap-gap">
          <h2 className="caps text-fg-muted">Span of control</h2>
          <SpanPanel spans={now.spans} shiftName={now.shift.name} operatorCount={now.operators.length} />
        </div>
      </section>

      <section aria-label="Oversight debt" className="flex flex-col gap-2">
        <h2 className="caps text-fg-muted">Oversight debt · all shifts</h2>
        <div className="grid grid-cols-12 items-stretch gap-gap">
          <div className="col-span-4 grid">
            <MetricTile hero label={COPY.debt.total} value={heroTotal} delta={delta(heroTotal, prev?.total)} sparkline={history} to="/inbox?scope=team"
              footer={`${current.unreviewedFootage} + ${toTriage} + ${current.staleEscalations} + ${gapCount}, four queues`}
              definition="Footage to review + incidents to triage + re-routed escalations + coverage gaps. A plain sum you can reproduce by counting." />
          </div>
          <div className="col-span-8 grid grid-cols-4 gap-gap">
            <MetricTile label={COPY.debt.footage} value={current.unreviewedFootage} delta={delta(current.unreviewedFootage, prev?.unreviewedFootage)} to="/review" footer="Open review queue"
              definition="Unreviewed footage: reviews not yet at Resolved." />
            <MetricTile label={COPY.debt.triage} value={toTriage} to="/inbox?scope=team&q=kind:incident" footer="Open inbox, incidents only"
              definition="Incidents in Captured or Triaged, all shifts. Owned incidents are not counted: they are with someone." />
            <MetricTile label={COPY.debt.rerouted} value={current.staleEscalations} delta={delta(current.staleEscalations, prev?.staleEscalations)}
              to={stale[0] ? `/escalations/${stale[0].escalation.id}` : undefined} footer={stale[0] ? COPY.escalation.view : 'None timed out'}
              definition="Escalations nobody answered in time, so they moved to the next lead." />
            <MetricTile label={COPY.debt.gaps} value={gapCount} delta={delta(gapCount, prev?.uncoveredGaps)} to="/plan" footer={gap ? gapText : 'Fix in Plan'}
              definition="Uncovered primary-lead windows across the three shifts." />
          </div>
        </div>
      </section>
    </div>
  )
}
