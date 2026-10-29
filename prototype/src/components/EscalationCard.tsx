import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { EscalationView } from '../lib/queries'
import { getRota, ME_ID, personName } from '../lib/queries'
import { COPY } from '../lib/copy'
import { keyOf } from '../lib/keys'
import { cx } from '../lib/cx'
import { useSimNow } from '../lib/clock'
import { fmtCountdown, fmtRel, fmtTime, ms } from '../lib/time'
import { Icon } from './Icon'
import { SeverityChip } from './SeverityChip'
import { FlagPill } from './StatusMarker'
import { Avatar, Button, Kbd } from './ui'

export interface EscalationCardProps {
  view: EscalationView
  /** full = takeover screen; compact = one row (Now list); readonly = viewing someone else's. Default: full when view.isMine, else readonly. */
  variant?: 'full' | 'compact' | 'readonly'
  onAcknowledge?: () => void
  /** Someone else holds it: take it over (confirmed first). Compact row only, in the overflow. */
  onTakeOver?: () => void
  /** toLeadId defaults to the rota backup. The card shows a picker first. */
  onHandOff?: (toLeadId: string) => void
  onCall?: () => void
  /** Link target for "Open incident"; default /incidents/:id. */
  incidentHref?: string
  /** Link target for the Review / View link in the compact row; default /escalations/:id. */
  escalationHref?: string
  /** The parent already shows the incident title (page H1, banner): do not repeat it. Keeps the SEV ring so the card still reads as urgent. */
  hideTitle?: boolean
  /** The parent already shows severity, vehicle and flags: hide the chip row's meta. */
  hideMeta?: boolean
  className?: string
}

const reach = (r: 'reachable' | 'unreachable' | 'unknown', lastSeen?: string) => `${COPY.reach[r]}${r === 'unreachable' && lastSeen ? `, last seen ${lastSeen}` : ''}`

/**
 * "Never depend on one person." Shows raised-by, current owner, and rota backup with reachability, a mm:ss countdown to the auto re-route,
 * and the actions. Keys when focus is inside come from lib/keys.ts: Enter or a = Acknowledge, h = Hand off, p = Call, o = Open incident. Only the card you hold shows key hints.
 * The title clamps to 2 lines with the full title in a tooltip; use hideTitle / hideMeta when the parent already shows them. Esc never dismisses an unacknowledged card.
 * Announces once (role=alert); the live region updates every 15 s, not per tick. Ticks off useSimNow().
 */
export function EscalationCard({ view, variant, onAcknowledge, onTakeOver, onHandOff, onCall, incidentHref, escalationHref, hideTitle, hideMeta, className }: EscalationCardProps) {
  const e = view.escalation
  const v = variant ?? (view.isMine ? 'full' : 'readonly')
  const now = useSimNow(1000)
  const nav = useNavigate()
  const remaining = e.deadline ? ms(e.deadline) - now : 0
  const [picker, setPicker] = useState(false)
  const [menu, setMenu] = useState<'closed' | 'menu' | 'confirm'>('closed')
  const rota = getRota().filter((l) => l.id !== view.current.id)
  const [pick, setPick] = useState(view.backup?.id ?? rota[0]?.id)
  const ref = useRef<HTMLElement>(null)
  const href = incidentHref ?? `/incidents/${view.incident.id}`
  const escHref = escalationHref ?? `/escalations/${e.id}`
  const canAct = v !== 'readonly' && view.active
  const total = e.timeoutSec * 1000
  const live = Math.floor(Math.max(0, remaining) / 15000)
  const [alerted, setAlerted] = useState(false)
  useEffect(() => { setAlerted(true) }, [])

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.target instanceof HTMLInputElement || !canAct) return
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return
    if ((ev.key === 'Enter' && ev.target === ev.currentTarget) || ev.key === keyOf('acknowledge')) { ev.preventDefault(); onAcknowledge?.() }
    else if (ev.key === keyOf('handOff')) { ev.preventDefault(); setPicker(true) }
    else if (ev.key === keyOf('call')) { ev.preventDefault(); onCall?.() }
    else if (ev.key === keyOf('openIncident')) { ref.current?.querySelector<HTMLAnchorElement>('a[data-open]')?.click() }
  }

  const countdown = e.state === 'Acknowledged' || e.state === 'Handled'
    ? <p className="flex items-center gap-2 text-base text-fg"><Icon name="check" className="text-status-done" />{e.state === 'Handled' ? COPY.escalation.handled : COPY.escalation.acknowledged} by {e.ackBy && personName(e.ackBy)} {e.ackAt && fmtTime(e.ackAt)}</p>
    : (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className={cx('mono font-semibold tracking-tight tnum', view.isMine ? 'text-2xl text-fg' : 'text-lg text-fg-muted')} aria-hidden>{fmtCountdown(remaining)}</span>
          <span className={cx(view.backup ? 'text-sm text-fg-muted' : 'text-base font-medium text-fg')}>{view.backup ? (remaining > 0 ? `until re-route to ${view.backup.name}` : `Re-routing to ${view.backup.name}`) : COPY.escalation.noneLeft}</span>
        </div>
        <div className="h-1 rounded-xs bg-surface-sunken" role="presentation"><span className="block h-full rounded-xs bg-line-strong" style={{ width: `${Math.max(0, Math.min(100, (remaining / total) * 100))}%` }} /></div>
      </div>
    )

  const header = (
    <div className="flex min-w-0 items-start gap-2">
      <span className={cx('mt-0.5 inline-flex shrink-0 rounded-full', view.active && e.state === 'Raised' && 'sev-ring')}><SeverityChip sev={view.incident.sev} dot={hideMeta} /></span>
      {!hideTitle && <span className={cx('min-w-0 flex-1 text-md font-medium text-fg', v === 'compact' ? 'truncate' : 'line-clamp-2')} title={view.incident.title}>{view.incident.title}</span>}
      {hideTitle && <span className="flex-1 text-base text-fg-muted">{e.id}</span>}
      {!hideMeta && <span className="mono shrink-0 text-sm text-fg-subtle">{view.incident.vehicleLabel}</span>}
      {!hideMeta && view.rerouted && <FlagPill flag="Escalated" />}
    </div>
  )

  if (v === 'compact') {
    return (
      <article ref={ref} tabIndex={0} aria-label={`Escalation ${e.id}`} onKeyDown={onKey} className={cx('flex w-full min-h-row items-center gap-gap rounded-md border border-line bg-surface px-pad py-1', className)}>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cx('inline-flex shrink-0 rounded-sm', view.active && e.state === 'Raised' && 'sev-ring')}><SeverityChip sev={view.incident.sev} /></span>
            <span className="mono shrink-0 text-sm text-fg-subtle whitespace-nowrap">{view.incident.id}</span>
            <span className="min-w-0 flex-1 truncate text-md font-medium text-fg" title={view.incident.title}>{view.incident.title}</span>
          </div>
          <p className="truncate text-sm text-fg-muted">{view.active ? `Waiting on ${view.current.name}` : e.state}{view.incident.vehicleLabel ? ` · ${view.incident.vehicleLabel}` : ''}</p>
        </div>
        <span className="mono shrink-0 text-md font-semibold text-fg tnum" title="Time until re-route">{view.active ? fmtCountdown(remaining) : e.state}</span>
        {canAct && view.isMine && <Button variant="primary" onClick={onAcknowledge}>{COPY.escalation.acknowledge}</Button>}
        {canAct && !view.isMine && <Button variant="secondary" onClick={() => nav(escHref)}>{COPY.escalation.view}</Button>}
        {canAct && !view.isMine && (
          <span className="relative shrink-0" onKeyDown={(ev) => { if (ev.key === 'Escape' && menu !== 'closed') { ev.stopPropagation(); setMenu('closed') } }}>
            <Button variant="ghost" aria-label="More actions" aria-haspopup="menu" aria-expanded={menu !== 'closed'} onClick={() => setMenu(menu === 'closed' ? 'menu' : 'closed')}>⋯</Button>
            {menu === 'menu' && (
              <div role="menu" className="absolute right-0 top-full z-10 mt-1 rounded-md border border-line-strong bg-surface p-1">
                <button role="menuitem" autoFocus type="button" className="inline-flex h-ctl w-full items-center whitespace-nowrap rounded-sm px-pad text-base text-fg hover:bg-surface-hover" onClick={() => setMenu('confirm')}>{COPY.escalation.takeOver}</button>
              </div>
            )}
            {menu === 'confirm' && (
              <div role="alertdialog" aria-label="Confirm take over" className="absolute right-0 top-full z-10 mt-1 flex w-max max-w-full flex-col gap-2 rounded-md border border-line-strong bg-surface p-pad">
                <p className="text-sm text-fg">Take over from {view.current.name}? You become the escalation owner.</p>
                <div className="flex gap-2"><Button variant="primary" autoFocus onClick={() => { setMenu('closed'); onTakeOver?.() }}>{COPY.escalation.takeOver}</Button><Button variant="ghost" onClick={() => setMenu('closed')}>Cancel</Button></div>
              </div>
            )}
          </span>
        )}
        {(!canAct || view.isMine) && <Link data-open to={escHref} className="inline-flex h-ctl min-w-hit shrink-0 items-center text-base text-fg-link underline">{view.isMine ? COPY.escalation.review : COPY.escalation.view}</Link>}
      </article>
    )
  }

  return (
    <article ref={ref} tabIndex={0} aria-label={`Escalation ${e.id}`} onKeyDown={onKey}
      className={cx('@container flex flex-col gap-gap rounded-md border bg-surface p-pane', view.active ? 'border-line-strong' : 'border-line', className)}>
      {view.active && alerted && <span className="sr-only" role="alert">Escalation {e.id}: {view.incident.title}. {view.current.name} must acknowledge within {fmtCountdown(Math.max(0, remaining))}.</span>}
      <span className="sr-only" aria-live="polite" key={live}>{view.active ? `${fmtCountdown(live * 15000)} remaining` : ''}</span>
      {header}
      <ol className="flex flex-col gap-1" aria-label="Escalation chain">
        {view.chain.map(({ link, person }, i) => {
          const lead = person.kind === 'lead' ? getRota().find((l) => l.id === person.id) : undefined
          const you = person.id === ME_ID
          const settled = e.state === 'Handled' ? COPY.escalation.handled : COPY.escalation.acknowledged
          const state = link.link === 'timed-out' ? (link.at ? `${COPY.escalation.timedOut} ${fmtRel(link.at)}` : COPY.escalation.timedOut) : link.link === 'current' ? (you ? COPY.escalation.mustActYou : COPY.escalation.mustAct) : link.link === 'next' ? COPY.escalation.nextIfUnanswered : i === 0 ? COPY.escalation.raised : settled
          const mine = link.link === 'current' && you
          return (
            <li key={i} aria-current={link.link === 'current' ? 'step' : undefined}
              className={cx('flex items-center gap-gap rounded-sm px-2 py-1', mine && 'border border-line-strong bg-surface-selected', link.link === 'current' && !you && 'bg-surface-sunken', link.link === 'timed-out' && 'text-fg-subtle')}>
              <Avatar initials={person.initials} />
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-1 text-base text-fg" title={`${person.name}${you ? ' (you)' : ''}`}><span className="shrink-0 text-sm text-fg-subtle">{COPY.escalation.chainRole[link.role] ?? link.role}</span> <span className={cx('truncate', link.link === 'timed-out' ? 'text-fg-muted' : 'font-medium')}>{person.name}</span>{you && <span className="shrink-0">(you)</span>}</p>
                <p className="truncate text-sm text-fg-muted">{reach(link.reachable, lead ? fmtRel(lead.lastSeen) : undefined)}</p>
                <p className={cx('@md:hidden truncate text-sm', mine ? 'font-semibold text-fg' : 'text-fg-subtle')}>{state}</p>
              </div>
              <span className={cx('hidden shrink-0 text-sm @md:inline', mine ? 'font-semibold text-fg' : link.link === 'timed-out' ? 'rounded-sm border border-line px-2 text-fg-muted' : 'text-fg-subtle')}>{state}</span>
            </li>
          )
        })}
      </ol>
      {view.rerouted && <p className="text-sm text-fg-muted">No acknowledgement within {Math.round(e.timeoutSec / 60)} min. {COPY.escalation.rerouted} to {view.current.name}.</p>}
      {countdown}
      {picker && canAct && (
        <fieldset className="flex flex-col gap-1 rounded-md border border-line p-pad">
          <legend className="px-1 text-sm text-fg-muted">Hand off to (rota order)</legend>
          {rota.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-base text-fg">
              <input type="radio" name={`ho-${e.id}`} className="accent-accent" checked={pick === l.id} onChange={() => setPick(l.id)} autoFocus={pick === l.id} />
              {l.name}{l.id === view.backup?.id && <span className="text-sm text-fg-subtle">(next on rota)</span>}<span className="text-sm text-fg-subtle">{reach(l.reachable)}</span>
            </label>
          ))}
          <div className="mt-1 flex gap-2"><Button variant="primary" onClick={() => { if (pick) onHandOff?.(pick); setPicker(false) }}>{COPY.escalation.handOff}</Button><Button variant="ghost" onClick={() => setPicker(false)}>Cancel</Button></div>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canAct && !picker && (
          <>
            <Button variant="primary" onClick={onAcknowledge} hint={keyOf('acknowledge')}>{COPY.escalation.acknowledge}</Button>
            <Button variant="secondary" onClick={() => setPicker(true)} hint={keyOf('handOff')}>{COPY.escalation.handOff}</Button>
            <Button variant="ghost" onClick={onCall} hint={keyOf('call')} icon={<Icon name="phone" />}>{COPY.escalation.call}</Button>
          </>
        )}
        {v === 'readonly' && view.active && <span className="text-base text-fg-muted">Waiting on {view.current.name}. You are not the current owner.</span>}
        <Link data-open to={href} className="ml-auto inline-flex items-center gap-1 text-base text-fg-link underline">{COPY.escalation.openIncident} <Kbd>{keyOf('openIncident')}</Kbd></Link>
      </div>
      {e.history.length > 0 && (
        <details className="text-sm text-fg-muted">
          <summary className="cursor-pointer">History ({e.history.length})</summary>
          <ul className="mt-1 flex flex-col gap-px">{[...e.history].reverse().map((h) => <li key={h.id}><span className="mono text-fg-subtle">{fmtTime(h.at)}</span> {h.text}</li>)}</ul>
        </details>
      )}
    </article>
  )
}
