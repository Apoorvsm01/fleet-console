import { useState } from 'react'
import { useSimNow } from '../../lib/clock'
import { getEscalation } from '../../lib/queries'
import { acknowledgeEscalation, useStore } from '../../lib/store'
import { fmtCountdown, fmtTime, ms } from '../../lib/time'
import { useIosNav } from './parts'

export default function LockScreen() {
  useStore()
  const now = useSimNow(1000)
  const { go } = useIosNav()
  const [expanded, setExpanded] = useState(true)
  const view = getEscalation('ESC-0206')!
  const e = view.escalation
  const inc = view.incident
  const acked = e.state === 'Acknowledged'
  const left = e.deadline ? fmtCountdown(ms(e.deadline) - now) : null
  const body = acked ? `${inc.title}. You acknowledged at ${e.ackAt ? fmtTime(e.ackAt) : ''}.` : `${inc.title}. Re-routed to you. ${left} left before it re-routes.`
  const day = new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
  return (
    <div className="ios-wallpaper absolute inset-0 flex flex-col items-center pt-safe" data-lock>
      <p className="t-subhead mt-6 font-medium text-n-200">{day}</p>
      <p className="font-light" style={{ fontSize: 'var(--text-glance-xl)', lineHeight: 'var(--text-glance-xl--line-height)' }}>{fmtTime(now)}</p>

      <div className="mt-auto w-full px-pane pb-24">
        <div className="ios-lock-glass overflow-hidden rounded-lg">
          <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="ios-press flex w-full gap-gap p-pad text-left" aria-label="Critical Alert from Plumb">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-md font-bold text-fg-on-accent">P</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-baseline justify-between gap-gap"><span className="text-md font-semibold">SEV1 · {inc.id}</span><span className="text-sm text-n-300">now</span></span>
              <span className="text-base [overflow-wrap:anywhere]">{body}</span>
            </span>
          </button>
          {expanded && !acked && (
            <div className="flex border-t border-n-700">
              <button type="button" onClick={() => { acknowledgeEscalation(e.id) }} className="ios-press h-(--spacing-target) flex-1 text-md font-semibold text-ink-200">Acknowledge</button>
              <button type="button" onClick={() => go(`esc/${e.id}`)} className="ios-press h-(--spacing-target) flex-1 border-l border-n-700 text-md text-n-0">Open</button>
            </div>
          )}
          {acked && <div className="flex border-t border-n-700"><button type="button" onClick={() => go(`esc/${e.id}`)} className="ios-press h-(--spacing-target) flex-1 text-md font-semibold text-ink-200">Open protocol</button></div>}
        </div>
      </div>
      <button type="button" onClick={() => go('esc')} className="ios-press absolute bottom-10 h-(--spacing-target) rounded-md px-pad text-sm text-n-300 sr-only focus:not-sr-only">Unlock to Escalations</button>
      <span className="ios-indicator" data-on-dark="true" />
    </div>
  )
}
