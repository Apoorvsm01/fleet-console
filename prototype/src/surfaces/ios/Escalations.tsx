import { Fragment } from 'react'
import { EmptyState, FlagPill, Icon, SeverityChip } from '../../components'
import { useSimNow } from '../../lib/clock'
import { cx } from '../../lib/cx'
import { COPY } from '../../lib/copy'
import { ME_ID, getEscalations, type EscalationView } from '../../lib/queries'
import { acknowledgeEscalation, useStore } from '../../lib/store'
import { fmtCountdown, ms } from '../../lib/time'
import { CtaButton, Divider, EscalationRow, Group, Screen, useIosNav, useIosToast } from './parts'

const open = (v: EscalationView) => v.escalation.state !== 'Handled'

export default function Escalations() {
  useStore()
  const now = useSimNow(1000)
  const { go, sp } = useIosNav()
  const forceEmpty = sp.get('empty') === '1'
  const all = forceEmpty ? [] : getEscalations()
  const mine = all.filter((v) => open(v) && v.current.id === ME_ID)
  const others = all.filter((v) => open(v) && v.current.id !== ME_ID)
  const recent = all.filter((v) => !open(v)).sort((a, b) => (b.escalation.raisedAt).localeCompare(a.escalation.raisedAt)).slice(0, 3)
  const activeCount = mine.length + others.length
  const openEsc = (id: string) => go(`esc/${id}`)

  return (
    <Screen title="Escalations" tab="esc" subtitle={activeCount ? `${activeCount} active on PM shift${mine.length ? `, ${mine.length} need${mine.length === 1 ? 's' : ''} you` : ''}` : 'Nothing waiting on you'}>
      {activeCount === 0 && (
        <div className="mx-pane mt-4 rounded-lg bg-surface py-6">
          <EmptyState variant="success" title="All clear" description="No escalations are waiting. You will get a push the moment one is routed to you." />
        </div>
      )}

      {mine.length > 0 && (
        <section className="mt-2 px-pane" aria-label="Needs you now">
          <h2 className="caps px-2 pb-1.5 text-fg-muted">Needs you now</h2>
          {mine.map((v) => <HeroCard key={v.escalation.id} view={v} now={now} onOpen={() => openEsc(v.escalation.id)} />)}
        </section>
      )}

      {others.length > 0 && (
        <Group title="Other active" footer="Someone else is the escalation owner. You can view these; only they can acknowledge.">
          {others.map((v, i) => <Fragment key={v.escalation.id}>{i > 0 && <Divider />}<EscalationRow view={v} now={now} onOpen={() => openEsc(v.escalation.id)} /></Fragment>)}
        </Group>
      )}

      {recent.length > 0 && (
        <Group title="Handled recently">
          {recent.map((v, i) => <Fragment key={v.escalation.id}>{i > 0 && <Divider />}<EscalationRow view={v} now={now} onOpen={() => openEsc(v.escalation.id)} /></Fragment>)}
        </Group>
      )}
    </Screen>
  )
}

function HeroCard({ view, now, onOpen }: { view: EscalationView; now: number; onOpen: () => void }) {
  const toast = useIosToast()
  const e = view.escalation
  const inc = view.incident
  const live = view.active
  const remaining = e.deadline ? ms(e.deadline) - now : undefined
  const pct = remaining !== undefined ? Math.max(0, Math.min(100, (remaining / (e.timeoutSec * 1000)) * 100)) : 0
  const prev = view.chain.find((c) => c.link.link === 'timed-out')
  const done = ['safe', 'location', 'emergency', 'preserve', 'notify'].filter((s) => e.protocol?.[s]).length
  return (
    <div className={cx('relative overflow-hidden rounded-lg border bg-surface', live ? 'border-sev1-line' : 'border-line')}>
      <button type="button" onClick={onOpen} className="ios-press flex w-full flex-col gap-2 p-pad text-left" aria-label={`${e.id}, ${inc.title}. ${live ? 'Needs you now' : 'Acknowledged'}`}>
        <span className="flex items-center gap-2">
          <span className={cx(live && inc.sev === 1 && 'sev-ring rounded-sm')}><SeverityChip sev={inc.sev} /></span>
          {view.rerouted && <FlagPill flag="Escalated" />}
          <span className="font-mono text-sm text-fg-muted">{inc.id}</span>
          <span className="ml-auto flex items-center gap-1 text-fg-subtle"><Icon name="right" /></span>
        </span>
        <span className="line-clamp-3 text-lg font-semibold text-fg [overflow-wrap:anywhere]">{inc.title}</span>
        <span className="t-subhead text-fg-muted [overflow-wrap:anywhere]">
          {view.rerouted && prev ? `Re-routed to you: ${prev.person.name} timed out after ${Math.round(e.timeoutSec / 60)} min.` : live ? 'Paged to you.' : `Acknowledged. Protocol ${done} of 5 done.`}
        </span>
        {live && remaining !== undefined && (
          <span className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span className="text-sm text-fg-muted">{view.backup ? `Then re-routes to ${view.backup.name}` : COPY.escalation.noneLeft}</span>
              <span className={cx('font-mono text-xl font-semibold', remaining < 60_000 ? 'text-sev1-fg' : 'text-fg')} aria-label={`${fmtCountdown(remaining)} left`}>{fmtCountdown(remaining)}</span>
            </span>
            <span className="h-(--spacing-bar) w-full overflow-hidden rounded-full bg-track" aria-hidden><span className="ios-progress block h-full bg-sev1-mark" style={{ width: `${pct}%` }} /></span>
          </span>
        )}
      </button>
      <div className="px-pad pb-pad">
        {live ? (
          <div className="flex gap-gap">
            <div className="min-w-0 flex-1"><CtaButton onClick={() => { acknowledgeEscalation(e.id); toast(`Acknowledged ${e.id}. You own this now.`) }}>{COPY.escalation.acknowledge}</CtaButton></div>
            <div className="w-28 shrink-0"><CtaButton variant="secondary" onClick={onOpen}>{COPY.escalation.review}</CtaButton></div>
          </div>
        ) : <CtaButton onClick={onOpen}>Continue protocol</CtaButton>}
      </div>
    </div>
  )
}
