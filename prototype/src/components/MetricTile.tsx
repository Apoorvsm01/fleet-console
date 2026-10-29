import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { HealthState, Sev } from '../data/types'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import { SeverityChip } from './SeverityChip'
import { Button } from './ui'
import { LoadingState } from './states'

export interface MetricTileProps {
  /** Caps label, e.g. "Unreviewed footage". */
  label: string
  value: number | string
  /** Unit in subtle text, e.g. "h". */
  unit?: string
  /** text-2xl hero metric (Now debt total). */
  hero?: boolean
  /** Change vs last shift. `text` is the words ("vs last shift"); the arrow and number are drawn for you. goodWhen decides nothing visually (no green/red): direction is words + arrow only. */
  delta?: { value: number; text: string }
  /** Ratio mode (ODD): shows "achieved / target unit" with a bar and a target tick. No severity hues. */
  ratio?: { achieved: number; target: number }
  /** Health mode: Healthy = neutral check, Degraded = SEV3 chip, Failing = SEV2 chip (pass sev=1 to override). */
  health?: HealthState
  sev?: Sev
  /** The tile is a link: the count must reconcile with the queue it opens. */
  to?: string
  onClick?: () => void
  /** Footer link text, e.g. "12 items". */
  footer?: string
  /** Definition shown on hover, and on `?` while focused. State the formula so leads can reproduce the number. */
  definition?: string
  sparkline?: number[]
  state?: 'default' | 'loading' | 'error' | 'stale'
  /** For state="stale": "Stale 14 m". */
  staleLabel?: string
  onRetry?: () => void
  className?: string
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / (max - min || 1)) * 100}`).join(' ')
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-6 w-full" aria-hidden><polyline points={pts} fill="none" className="stroke-fg-subtle" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
}

/** Number is the interface: label, value, delta in words, optional sparkline/target bar. Zero shows "Clear" with a check. Never a gauge or composite score. */
export function MetricTile({ label, value, unit, hero, delta, ratio, health, sev, to, onClick, footer, definition, sparkline, state = 'default', staleLabel, onRetry, className }: MetricTileProps) {
  const [showDef, setShowDef] = useState(false)
  const zero = value === 0 && !ratio && !health
  const cls = cx('group flex min-w-0 flex-col gap-2 rounded-md border border-line bg-surface p-pane shadow-1 text-left', (to || onClick) && 'hover:bg-surface-hover', className)
  const maxR = ratio ? Math.max(ratio.target, ratio.achieved, 1) : 1
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="caps text-fg-muted">{label}</span>
        {state === 'stale' && <span className="inline-flex h-chip items-center rounded-sm border border-flag-line bg-flag-bg px-2 text-sm text-flag-fg"><Icon name="hourglass" className="mr-1 size-3" />{staleLabel ?? 'Stale'}</span>}
        {sev && <SeverityChip sev={sev} />}
        {health === 'Degraded' && <SeverityChip sev={3} />}
        {health === 'Failing' && <SeverityChip sev={sev ?? 2} />}
      </div>
      {state === 'loading' ? <LoadingState variant="tile" label={`Loading ${label}`} />
        : state === 'error' ? <span className="flex flex-col items-start gap-1"><span className="text-base text-fg">Can't compute</span>{onRetry && <Button variant="secondary" onClick={onRetry} hint="r">Retry</Button>}</span>
        : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={cx('font-semibold tracking-tight text-fg tnum', hero ? 'text-2xl' : 'text-xl')}>{ratio ? `${ratio.achieved} / ${ratio.target}` : value}</span>
              {unit && <span className="text-sm text-fg-subtle">{unit}</span>}
              {health === 'Healthy' && <span className="inline-flex items-center gap-1 text-sm text-fg-muted"><Icon name="check" className="size-3" />Healthy</span>}
              {zero && <span className="inline-flex items-center gap-1 text-sm text-fg-link"><Icon name="check" className="size-3 text-status-done" />Clear</span>}
            </div>
            {ratio && (
              <div className="relative h-2 rounded-xs bg-surface-sunken" role="img" aria-label={`${ratio.achieved} of ${ratio.target} ${unit ?? ''}`}>
                <span className="absolute inset-y-0 left-0 rounded-xs bg-accent" style={{ width: `${(ratio.achieved / maxR) * 100}%` }} />
                <span aria-hidden className="absolute -inset-y-1 w-0.5 bg-fg" style={{ left: `${(ratio.target / maxR) * 100}%` }} title="Target" />
              </div>
            )}
            {delta && (
              <span className="inline-flex items-center gap-1 text-sm text-fg-muted">
                <Icon name={delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'density'} className="size-3" />
                {delta.value === 0 ? 'No change' : `${delta.value > 0 ? '+' : ''}${delta.value}`} {delta.text}
              </span>
            )}
            {sparkline && sparkline.length > 1 && <Spark data={sparkline} />}
          </>
        )}
      {showDef && definition && <p className="rounded-sm bg-surface-sunken p-2 text-sm text-fg-muted">{definition}</p>}
      {footer && <span className="mt-auto inline-flex items-center gap-1 text-sm text-fg-link">{footer}<Icon name="right" className="size-3" /></span>}
    </>
  )
  const common = {
    className: cls, title: definition, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === '?') setShowDef((s) => !s) },
  }
  if (to) return <Link to={to} {...common}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} {...common}>{body}</button>
  return <div tabIndex={definition ? 0 : undefined} {...common}>{body as ReactNode}</div>
}
