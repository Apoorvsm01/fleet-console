import { LIFECYCLE, type Flag, type Status } from '../data/types'
import { cx } from '../lib/cx'
import { keyOf } from '../lib/keys'
import { Icon } from './Icon'
import { Button } from './ui'

const FLAG_ICON: Record<Flag, string> = { Escalated: 'arrow-up-bar', Overdue: 'clock', Stale: 'hourglass-dashed' }

/** Violet flag pill. Flags are additive and never replace the status. `age` e.g. "2d" for Overdue. */
export function FlagPill({ flag, age, className }: { flag: Flag; age?: string; className?: string }) {
  return (
    <span className={cx('inline-flex h-chip items-center gap-1 rounded-sm border border-flag-line bg-flag-bg px-2 text-sm font-medium whitespace-nowrap text-flag-fg', className)}
      title={flag === 'Escalated' ? 'Escalated: raised up the on-call chain' : flag === 'Overdue' ? 'Overdue: past its due time' : 'Stale: no update for 72 h or more'}>
      <Icon name={FLAG_ICON[flag]} className="size-3" />
      {flag}{age ? ` ${age}` : ''}
    </span>
  )
}

function Bar({ status }: { status: Status }) {
  const n = LIFECYCLE.indexOf(status) + 1
  const done = status === 'Verified'
  return (
    <span className="inline-flex items-center gap-px" aria-hidden>
      {LIFECYCLE.map((s, i) => (
        <span key={s} className={cx('h-seg-h w-seg-w rounded-xs', i < n ? (done ? 'bg-status-done' : 'bg-status-on') : 'bg-status-off')} />
      ))}
    </span>
  )
}

export interface StatusStep { by: string; at: string }
export interface StatusMarkerProps {
  status: Status
  flags?: Flag[]
  /** Overdue age text per flag, e.g. { Overdue: '2d' }. */
  flagAge?: Partial<Record<Flag, string>>
  /** inline = bar + label + flags (tables). compact = bar only with tooltip (timelines). block = stepper with who/when (page header). */
  variant?: 'inline' | 'compact' | 'block'
  /** block only: who/when for each completed step. */
  steps?: Partial<Record<Status, StatusStep>>
  /** block only: moves to the next legal step. */
  onAdvance?: () => void
  /** block only: why advancing is disabled (e.g. resolver cannot verify). */
  advanceDisabledReason?: string
  className?: string
}
/** One lifecycle for Incident, Damage/repair, Footage review: 5-segment bar + label. Verified shows a check in the `status-done` ink. Never uses severity hues. */
export function StatusMarker({ status, flags = [], flagAge, variant = 'inline', steps, onAdvance, advanceDisabledReason, className }: StatusMarkerProps) {
  const done = status === 'Verified'
  const tip = steps?.[status] ? `${status} by ${steps[status]!.by}, ${steps[status]!.at}` : status
  if (variant === 'compact') return <span className={cx('inline-flex items-center', className)} title={tip} role="img" aria-label={`Status: ${status}`}><Bar status={status} /></span>
  if (variant === 'inline') {
    return (
      <span className={cx('inline-flex items-center gap-2 whitespace-nowrap', className)} title={tip}>
        <Bar status={status} />
        <span className={cx('text-base', done ? 'text-fg-link' : 'text-fg')}>{status}</span>
        {done && <Icon name="check" className="size-3 text-status-done" />}
        {flags.map((f) => <FlagPill key={f} flag={f} age={flagAge?.[f]} />)}
      </span>
    )
  }
  const idx = LIFECYCLE.indexOf(status)
  const next = LIFECYCLE[idx + 1]
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <ol className="flex items-start gap-gap" aria-label="Lifecycle">
        {LIFECYCLE.map((s, i) => (
          <li key={s} aria-current={i === idx ? 'step' : undefined} className={cx('flex min-w-0 flex-col gap-px', )}>
            <span className={cx('h-seg-h rounded-xs', i <= idx ? (done ? 'bg-status-done' : 'bg-status-on') : 'bg-status-off', 'w-step')} />
            <span className={cx('text-sm', i === idx ? 'font-semibold text-fg' : i > idx ? 'text-fg-subtle' : 'text-fg-muted')}>{s}{s === 'Verified' && i <= idx && <Icon name="check" className="ml-1 inline size-3 text-status-done" />}</span>
            <span className="truncate text-xs text-fg-subtle">{steps?.[s] ? `${steps[s]!.by}, ${steps[s]!.at}` : i > idx ? '' : '-'}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        {flags.map((f) => <FlagPill key={f} flag={f} age={flagAge?.[f]} />)}
        {onAdvance && next && <Button variant="secondary" onClick={onAdvance} disabled={!!advanceDisabledReason} disabledReason={advanceDisabledReason} hint={keyOf('advance')}>Mark {next.toLowerCase()}</Button>}
      </div>
    </div>
  )
}
