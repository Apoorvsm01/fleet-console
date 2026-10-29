import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, ErrorState, Icon, SeverityChip, EscalationCard } from '../components'
import { getEscalation, getIncident, getRota } from '../lib/queries'
import { acknowledgeEscalation, getProtocol, handOffEscalation, resolveEscalation, setProtocolStep, useStore } from '../lib/store'
import { PROTOCOL_STEPS as PROTOCOL } from '../lib/protocol'
import { COPY } from '../lib/copy'
import { useApp } from '../lib/app'
import { useSimNow } from '../lib/clock'
import { fmtDateTime, fmtRel, fmtTime } from '../lib/time'
import { cx } from '../lib/cx'

export default function EscalationScreen() {
  const { id = '' } = useParams()
  useStore()
  const { toast } = useApp()
  const now = useSimNow(1000)
  const focusRef = useRef<HTMLInputElement>(null)
  const wasAcked = useRef<boolean | null>(null)
  const view = getEscalation(id)
  const ackedNow = !!view && (view.escalation.state === 'Acknowledged' || view.escalation.state === 'Handled')
  useEffect(() => {
    // Hand focus to the next step once, when acknowledgement happens on this page.
    if (wasAcked.current === false && ackedNow) focusRef.current?.focus()
    wasAcked.current = ackedNow
  }, [ackedNow])
  if (!view) {
    return <div className="flex min-h-0 flex-1 flex-col p-pane"><ErrorState blocking title={`No escalation ${id}`} detail="Check the ID, or open the active list from Now." /><Link to="/now" className="mt-gap inline-flex h-ctl items-center gap-2 self-center rounded-md px-pad text-base text-fg underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"><Icon name="left" />Back to Now</Link></div>
  }
  const e = view.escalation
  const inc = view.incident
  const detail = getIncident(inc.id)
  const ticks = getProtocol(e.id)
  const count = PROTOCOL.filter((s) => ticks[s.id]).length
  const allDone = count === PROTOCOL.length
  const acked = e.state === 'Acknowledged' || e.state === 'Handled'
  const isResolved = e.state === 'Handled'
  const nextId = acked && !isResolved ? PROTOCOL.find((x) => !ticks[x.id])?.id : undefined
  const toggle = (sid: string) => setProtocolStep(e.id, sid, !ticks[sid])
  const operator = view.raisedBy
  const tag = detail?.tags[0]
  const vehicle = detail?.vehicles[0]
  const drive = detail?.drives[0]
  const where = tag?.locationLabel ?? 'Location not reported'
  const rota = getRota()
  const events = [...e.history].sort((a, b) => a.at.localeCompare(b.at))

  const sec = 'flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-pane'
  const link = 'inline-flex h-ctl items-center gap-2 rounded-md px-pad text-base text-fg underline underline-offset-2 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2'
  const reason = !acked ? `Acknowledge, then tick all ${PROTOCOL.length} steps` : !allDone ? `${PROTOCOL.length - count} of ${PROTOCOL.length} steps left` : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex min-h-row items-center gap-gap border-b border-line px-pane py-2">
        <Link to="/now" className={link}><Icon name="left" />Back to Now</Link>
        <h1 className="flex min-w-0 items-center gap-2 text-md font-medium text-fg"><SeverityChip sev={inc.sev} /><span className="truncate">Escalation {e.id}</span></h1>
        <div className="text-sm text-fg-subtle">{inc.id}. Raised {fmtDateTime(e.raisedAt)} ({fmtRel(e.raisedAt, now)})</div>
        <div className="ml-auto"><Link to={`/incidents/${inc.id}`} className={link}><Icon name="external" />{COPY.escalation.openIncident}</Link></div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-[minmax(0,1fr)_var(--spacing-side)] gap-gap p-pane">
          <div className="flex min-w-0 flex-col gap-gap">
            <section aria-labelledby="what" className={sec}>
              <h2 id="what" className="caps text-fg-muted">What happened</h2>
              <p className="text-lg font-semibold text-fg [overflow-wrap:anywhere]">{inc.title}</p>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-gap gap-y-1 text-base">
                <dt className="text-fg-muted">Where</dt><dd className="text-fg [overflow-wrap:anywhere]">{where}{drive ? `, drive ${drive.id}` : ''}</dd>
                <dt className="text-fg-muted">Vehicle</dt><dd className="text-fg">{vehicle ? `${vehicle.id}${vehicle.nickname ? ` (${vehicle.nickname})` : ''}, ${vehicle.status}` : inc.vehicleLabel}</dd>
                <dt className="text-fg-muted">Operator</dt><dd className="truncate text-fg" title={operator.name}>{operator.name}</dd>
                <dt className="text-fg-muted">Operator safety</dt>
                <dd className={cx('text-fg', !ticks.safe && 'font-medium')}>{ticks.safe ? `Confirmed safe at ${fmtTime(ticks.safe)}` : 'Not yet confirmed. Step 1 below.'}</dd>
                <dt className="text-fg-muted">Vehicle note</dt><dd className="text-fg [overflow-wrap:anywhere]">{vehicle?.condition || 'None'}</dd>
              </dl>
            </section>

            <section aria-labelledby="proto" className={cx(sec, 'gap-gap')}>
              <div className="flex items-baseline justify-between gap-gap">
                <h2 id="proto" className="caps text-fg-muted">Protocol, do in this order</h2>
                <span className="text-base text-fg" aria-live="polite">{count} of {PROTOCOL.length} done</span>
              </div>
              {!acked && <p className="text-sm text-fg-muted">Steps unlock when you acknowledge.</p>}
              <ol className="flex flex-col gap-2">
                {PROTOCOL.map((s, i) => {
                  const t = ticks[s.id]
                  const isNext = s.id === nextId
                  return (
                    <li key={s.id}>
                      <label className={cx('flex min-h-hit items-start gap-gap rounded-md border p-pad focus-within:outline-2 focus-within:outline-offset-2',
                        !acked ? 'border-line bg-surface-sunken text-fg-disabled' : t ? 'border-line bg-surface-sunken' : isNext ? 'border-accent bg-surface' : 'border-line-strong bg-surface',
                        acked && !isResolved && 'cursor-pointer')}>
                        <input ref={isNext ? focusRef : undefined} type="checkbox" className="mt-1 size-icon accent-(--color-status-done)" checked={!!t} onChange={() => toggle(s.id)} disabled={!acked || isResolved} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={cx('text-base font-medium [overflow-wrap:anywhere]', acked ? 'text-fg' : 'text-fg-disabled')}>{i + 1}. {s.title}</span>
                          <span className={cx('text-sm', acked ? 'text-fg-muted' : 'text-fg-disabled')}>{s.hint}</span>
                        </span>
                        {t && <span className="shrink-0 text-sm tabular-nums text-fg-muted">Done {fmtTime(t)}</span>}
                        {isNext && <span className="caps shrink-0 text-accent">Next</span>}
                      </label>
                    </li>
                  )
                })}
              </ol>
            </section>

            <section aria-labelledby="hist" className={sec}>
              <h2 id="hist" className="caps text-fg-muted">Page history</h2>
              {events.length === 0 ? <p className="text-base text-fg-muted">No events yet.</p> : (
                <ol className="flex flex-col">
                  {events.map((ev) => (
                    <li key={ev.id} className="flex gap-gap border-t border-line py-2 text-base first:border-t-0">
                      <time className="w-12 shrink-0 tabular-nums text-fg-muted" dateTime={ev.at}>{fmtTime(ev.at)}</time>
                      <span className="min-w-0 text-fg [overflow-wrap:anywhere]">{ev.kind === 'rerouted' && <Icon name="arrow-up-bar" className="mr-1 inline" />}{ev.text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-gap self-start">
            <EscalationCard
              view={view}
              variant="full"
              hideTitle
              hideMeta
              onAcknowledge={() => { acknowledgeEscalation(e.id); toast({ message: `Acknowledged ${e.id}. You own this now.` }) }}
              onHandOff={(to) => { handOffEscalation(e.id, to); toast({ message: `Handed off ${e.id}. Their countdown has started.` }) }}
              onCall={() => toast({ message: `Calling ${operator.name} (prototype: no call placed)` })}
              incidentHref={`/incidents/${inc.id}`}
            />
            <section aria-labelledby="close" className={sec}>
              <h2 id="close" className="caps text-fg-muted">Resolve</h2>
              {isResolved
                ? <p className="flex items-center gap-2 text-base text-fg"><Icon name="check" className="text-status-done" />Resolved. Full record is on the incident.</p>
                : <>
                    <div className="flex flex-wrap items-center gap-gap">
                      <Button variant="primary" disabled={!!reason} disabledReason={reason}
                        onClick={() => { if (resolveEscalation(e.id)) toast({ message: `${e.id} marked resolved. Footage review is queued on the incident.` }) }}>Mark escalation resolved</Button>
                      {reason && <span className="min-w-0 text-sm text-fg-muted">{reason}.</span>}
                    </div>
                  </>}
            </section>
            <section aria-labelledby="rota" className={sec}>
              <h2 id="rota" className="caps text-fg-muted">On-call rota, in paging order</h2>
              <p className="text-sm text-fg-muted">Unanswered after {Math.round(e.timeoutSec / 60)} min, the page moves to the next person on its own. No one has to remember.</p>
              <ol className="flex flex-col gap-1">
                {rota.map((l) => (
                  <li key={l.id} className={cx('flex items-baseline justify-between gap-gap text-base', l.id === view.current.id ? 'font-semibold text-fg' : 'text-fg-muted')}>
                    <span className="min-w-0 truncate" title={l.name}>{l.name}{l.id === view.current.id ? ' (has it now)' : ''}</span>
                    <span className="shrink-0 text-sm">{l.onCall === false ? 'Off call' : COPY.reach[l.reachable ?? 'unknown']}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
