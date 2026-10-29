import { useState } from 'react'
import { FlagPill, Icon, SeverityChip, StatusMarker } from '../../components'
import { useSimNow } from '../../lib/clock'
import { cx } from '../../lib/cx'
import { COPY } from '../../lib/copy'
import { PROTOCOL_STEPS } from '../../lib/protocol'
import { ME_ID, getEscalation, getIncident, getRota } from '../../lib/queries'
import { acknowledgeEscalation, applyDemoAcked, getProtocol, handOffEscalation, resolveEscalation, setProtocolStep, useStore } from '../../lib/store'
import { fmtCountdown, fmtTime, ms } from '../../lib/time'
import { useParams } from 'react-router-dom'
import { CtaButton, Divider, Group, Screen, Sheet, TextLink, useIosNav, useIosToast } from './parts'

const demoDone = new Set<string>()

export default function Takeover() {
  const { id = '' } = useParams()
  const { go, sp } = useIosNav()
  if (sp.get('demo') === 'acked' && !demoDone.has(id)) { demoDone.add(id); applyDemoAcked(id) }
  useStore()
  const now = useSimNow(1000)
  const toast = useIosToast()
  const [sheet, setSheet] = useState(false)
  const view = getEscalation(id)
  if (!view) {
    return (
      <Screen title="Escalation" large={false} back={{ label: 'Escalations', to: 'esc' }}>
        <p className="px-pane pt-6 text-center text-base text-fg-muted">No escalation {id}. It may have been handled and archived.</p>
      </Screen>
    )
  }
  const e = view.escalation
  const inc = view.incident
  const detail = getIncident(inc.id)
  const ticks = getProtocol(e.id)
  const count = PROTOCOL_STEPS.filter((s) => ticks[s.id]).length
  const acked = e.state === 'Acknowledged' || e.state === 'Handled'
  const handled = e.state === 'Handled'
  const mine = view.current.id === ME_ID
  const remaining = e.deadline ? ms(e.deadline) - now : undefined
  const pct = remaining !== undefined ? Math.max(0, Math.min(100, (remaining / (e.timeoutSec * 1000)) * 100)) : 0
  const operator = view.raisedBy
  const opLink = view.chain[0].link
  const tag = detail?.tags[0]
  const vehicle = detail?.vehicles[0]
  const nextId = acked && !handled ? PROTOCOL_STEPS.find((s) => !ticks[s.id])?.id : undefined
  const left = PROTOCOL_STEPS.length - count
  const reason = !acked ? undefined : left > 0 ? `${left} ${left === 1 ? 'step' : 'steps'} left` : undefined
  const nextStep = PROTOCOL_STEPS.find((s) => !ticks[s.id])
  const blocked = mine && !acked // cover cannot be dismissed until acknowledged

  const handBtn = <CtaButton variant="secondary" compact onClick={() => setSheet(true)}>{COPY.escalation.handOff}</CtaButton>
  const footer = handled || !mine ? undefined : !acked ? (
    <div className="flex flex-col gap-2">
      <CtaButton onClick={() => { acknowledgeEscalation(e.id); toast(`Acknowledged ${e.id}. You own this now.`) }}>{COPY.escalation.acknowledge}</CtaButton>
      {handBtn}
    </div>
  ) : (
    <div className="flex gap-gap">
      <div className="w-28 shrink-0">{handBtn}</div>
      <div className="min-w-0 flex-1"><CtaButton compact reason={reason} onClick={() => { if (resolveEscalation(e.id)) { toast(`${e.id} resolved. Footage review is queued.`); go('esc') } }}>{reason ? `Resolve · ${reason}` : 'Resolve'}</CtaButton></div>
    </div>
  )

  return (
    <Screen title={`${e.id}`} large={false} anim="cover" back={blocked ? undefined : { label: 'Escalations', to: 'esc' }} footer={footer}>
      {/* what happened */}
      <div className="flex flex-col gap-2 px-pane pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityChip sev={inc.sev} />
          {view.rerouted && <FlagPill flag="Escalated" />}
          <StatusMarker status={inc.status} variant="inline" />
        </div>
        <h2 className="text-lg font-semibold text-fg [overflow-wrap:anywhere]">{inc.title}</h2>
        <p className="t-subhead text-fg-muted"><span className="font-mono text-sm">{inc.id}</span> · <span className="font-mono text-sm">{inc.vehicleLabel}</span> · raised {fmtTime(e.raisedAt)}</p>
      </div>

      {blocked && <p className="mx-pane mt-3 flex items-center gap-2 text-sm text-fg-muted"><Icon name="alert" />You can't leave until you acknowledge.</p>}
      {!mine && !handled && (
        <p className="mx-pane mt-3 rounded-lg bg-surface-sunken p-pad text-base text-fg-muted">{COPY.escalation.ownerLabel}: <strong className="font-semibold text-fg">{view.current.name}</strong>. {acked ? 'They have acknowledged it.' : 'You can read it here; only they can acknowledge.'}</p>
      )}

      {/* countdown */}
      {view.active && remaining !== undefined && (
        <section className="mt-4 px-pane" aria-label="Countdown">
          <div className="flex items-end justify-between rounded-lg bg-surface p-pad">
            <div className="flex flex-col">
              <span className="caps text-fg-muted">Time left</span>
              <span className={cx('t-timer font-mono font-semibold', remaining < 60_000 ? 'text-sev1-fg' : 'text-fg')} aria-label={`${fmtCountdown(remaining)} left`}>{fmtCountdown(remaining)}</span>
            </div>
            <span className="max-w-40 pb-1 text-right text-sm text-fg-muted">{view.backup ? `Then re-routes to ${view.backup.name}` : COPY.escalation.noneLeft}</span>
          </div>
          <div className="mx-pad -mt-1 h-(--spacing-bar) overflow-hidden rounded-full bg-track" aria-hidden><div className="ios-progress h-full bg-sev1-mark" style={{ width: `${pct}%` }} /></div>
        </section>
      )}
      {acked && !handled && (
        <div className="mx-pane mt-3 flex items-start gap-2 text-base text-fg">
          <Icon name="check" className="mt-0.5 text-status-done" />
          <p>{mine ? 'You' : view.chain.find((c) => c.person.id === e.ackBy)?.person.name ?? 'A lead'} acknowledged{e.ackAt ? ` at ${fmtTime(e.ackAt)}` : ''}. Countdown stopped.{mine && nextStep ? <> <span className="text-fg-muted">Next: {nextStep.title}.</span></> : null}</p>
        </div>
      )}

      {/* operator safety */}
      <Group title="Operator safety">
        <div className="flex flex-col gap-2 p-pad">
          <div className="flex items-center justify-between gap-gap">
            <div className="min-w-0">
              <p className="truncate text-md font-semibold text-fg" title={operator.name}>{operator.name}</p>
              <p className="t-subhead text-fg-muted">{COPY.reach[opLink.reachable]} · {vehicle?.id ?? inc.vehicleLabel}</p>
            </div>
            <button type="button" onClick={() => toast(`Calling ${operator.name} (prototype: no call placed)`)}
              className="ios-press flex h-(--spacing-target) shrink-0 items-center gap-2 rounded-md border border-line-strong px-pad text-base font-medium text-fg"><Icon name="phone" />Call</button>
          </div>
          <p className={cx('text-base', ticks.safe ? 'text-fg-muted' : 'font-medium text-fg')}>{ticks.safe ? `Confirmed safe at ${fmtTime(ticks.safe)}.` : 'Not yet confirmed. Speak to them first (protocol step 1).'}</p>
        </div>
      </Group>

      <Group title="What happened">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-gap gap-y-1.5 p-pad text-base">
          <dt className="text-fg-muted">Where</dt><dd className="text-fg [overflow-wrap:anywhere]">{tag?.locationLabel ?? 'Location not reported'}</dd>
          <dt className="text-fg-muted">Vehicle</dt><dd className="text-fg [overflow-wrap:anywhere]">{vehicle ? `${vehicle.id}${vehicle.nickname ? ` (${vehicle.nickname})` : ''}, ${vehicle.status}` : inc.vehicleLabel}</dd>
          <dt className="text-fg-muted">Note</dt><dd className="text-fg [overflow-wrap:anywhere]">{vehicle?.condition || 'None'}</dd>
        </dl>
      </Group>

      {/* protocol */}
      <Group title={`Protocol, in order (${count} of ${PROTOCOL_STEPS.length})`} footer={!acked ? 'Steps unlock when you acknowledge.' : undefined}>
        <ol>
          {PROTOCOL_STEPS.map((s, i) => {
            const t = ticks[s.id]
            const next = s.id === nextId
            return (
              <li key={s.id}>
                {i > 0 && <Divider />}
                <label className={cx('flex min-h-(--spacing-target) items-start gap-gap p-pad', acked && !handled && 'ios-press cursor-pointer')}>
                  <input type="checkbox" checked={!!t} disabled={!acked || handled} onChange={() => setProtocolStep(e.id, s.id, !t)}
                    className="mt-0.5 size-(--spacing-chip) shrink-0 accent-(--color-status-done)" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cx('text-base font-medium [overflow-wrap:anywhere]', acked ? 'text-fg' : 'text-fg-disabled')}>{i + 1}. {s.title}</span>
                    <span className={cx('text-sm', acked ? 'text-fg-muted' : 'text-fg-disabled')}>{s.hint}</span>
                    {t && <span className="text-sm tabular-nums text-fg-muted">Done {fmtTime(t)}</span>}
                  </span>
                  {next && <span className="caps shrink-0 pt-0.5 text-accent">Next</span>}
                </label>
              </li>
            )
          })}
        </ol>
      </Group>

      {/* chain */}
      <Group title="Page chain">
        <ol>
          {view.chain.map((c, i) => {
            const you = c.person.id === view.current.id && view.active
            const reach = COPY.reach[c.link.reachable]
            return (
              <li key={`${c.person.id}-${i}`}>
                {i > 0 && <Divider />}
                <div className="flex items-start justify-between gap-gap p-pad">
                  <div className="min-w-0">
                    <p className="text-sm text-fg-muted">{COPY.escalation.chainRole[c.link.role]}</p>
                    <p className="text-base font-medium text-fg [overflow-wrap:anywhere]">{c.person.name}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-sm text-fg-muted">
                    <span>{reach}</span>
                    {c.link.link === 'timed-out' && <span className="text-flag-fg">Timed out {c.link.at ? fmtTime(c.link.at) : ''}</span>}
                    {you && <span className="font-semibold text-fg">{view.isMine ? COPY.escalation.mustActYou : acked && mine ? 'You acknowledged' : COPY.escalation.mustAct}</span>}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </Group>

      <div className="flex justify-center pt-2">
        <TextLink icon="external" onClick={() => go(`inc/${inc.id}`)}>{COPY.escalation.openIncident}</TextLink>
      </div>

      {sheet && <HandOffSheet escId={e.id} currentId={view.current.id} backupId={view.backup?.id} onClose={() => setSheet(false)} />}
    </Screen>
  )
}

function HandOffSheet({ escId, currentId, backupId, onClose }: { escId: string; currentId: string; backupId?: string; onClose: () => void }) {
  const { go } = useIosNav()
  const toast = useIosToast()
  const rota = getRota().filter((l) => l.id !== currentId)
  const first = rota.find((l) => l.id === backupId && l.reachable !== 'unreachable') ?? rota.find((l) => l.reachable !== 'unreachable')
  const [pick, setPick] = useState(first?.id)
  const who = rota.find((l) => l.id === pick)
  return (
    <Sheet title="Hand off" onClose={onClose}>
      <p className="px-pane pb-2 text-sm text-fg-muted">The rota, in paging order. Their {`5-minute`} countdown starts when you confirm.</p>
      <div className="mx-pane overflow-hidden rounded-lg bg-surface-sunken" role="radiogroup" aria-label="Hand off to">
        {rota.map((l, i) => {
          const off = l.reachable === 'unreachable' || !l.onCall
          return (
            <div key={l.id}>
              {i > 0 && <Divider />}
              <button type="button" role="radio" aria-checked={pick === l.id} aria-disabled={off || undefined} data-autofocus={pick === l.id ? true : undefined}
                onClick={() => { if (!off) setPick(l.id) }} className={cx('ios-press flex min-h-row w-full items-center gap-gap px-pad py-2 text-left', off && 'text-fg-disabled')}>
                <span className="flex size-(--spacing-chip) shrink-0 items-center justify-center">{pick === l.id && <Icon name="check" className="text-accent" />}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-md font-medium" title={l.name}>{l.name}{l.id === backupId ? ' (backup)' : ''}</span>
                  <span className="text-sm text-fg-muted">{l.role} · {l.onCall ? 'On call' : 'Off call'} · {COPY.reach[l.reachable]}</span>
                </span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="px-pane pt-4">
        <CtaButton reason={who ? undefined : 'Pick someone reachable'} onClick={() => { if (!who) return; handOffEscalation(escId, who.id); toast(`Handed off ${escId} to ${who.name}. Their countdown has started.`); onClose(); go('esc') }}>
          {who ? `Hand off to ${who.name}` : 'Hand off'}
        </CtaButton>
      </div>
    </Sheet>
  )
}
