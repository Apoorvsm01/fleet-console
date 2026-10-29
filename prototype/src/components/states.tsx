import { useEffect, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import { Button } from './ui'

export interface EmptyStateProps {
  /** success = queue cleared (the goal state); first-use; no-results (name the filters); no-permission (say who can grant). */
  variant?: 'success' | 'first-use' | 'no-results' | 'no-permission'
  title: string
  /** One sentence naming the next step. No cheerful copy in safety contexts. */
  description?: ReactNode
  action?: { label: string; onClick: () => void; hint?: string }
  secondary?: { label: string; onClick: () => void }
  className?: string
}
/** An empty queue is a success message, not a blank. Primary action is the first tab stop in the region. */
export function EmptyState({ variant = 'first-use', title, description, action, secondary, className }: EmptyStateProps) {
  const icon = variant === 'success' ? 'check' : variant === 'no-results' ? 'filter' : variant === 'no-permission' ? 'user' : 'empty'
  return (
    <div role="status" className={cx('flex flex-col items-center gap-2 px-pane py-10 text-center', className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-fg-muted"><Icon name={icon} className="size-6" /></span>
      <h3 className="text-md font-medium text-fg">{title}</h3>
      {description && <p className="max-w-96 text-base text-fg-muted">{description}</p>}
      {(action || secondary) && (
        <div className="mt-2 flex items-center gap-gap">
          {action && <Button variant="primary" onClick={action.onClick} hint={action.hint}>{action.label}</Button>}
          {secondary && <Button variant="ghost" onClick={secondary.onClick}>{secondary.label}</Button>}
        </div>
      )}
    </div>
  )
}

export interface LoadingStateProps {
  /** rows = table skeleton, block = pane, tile = metric tile value. Layout and widths match the final content. */
  variant?: 'rows' | 'block' | 'tile'
  rows?: number
  /** Visible label; a skeleton is never unlabelled. */
  label?: string
  /** Skeleton appears after this delay (default 150 ms) to avoid flashes. */
  delayMs?: number
  className?: string
}
/** Skeleton that keeps the final layout. Always render the real chrome around it. */
export function LoadingState({ variant = 'rows', rows = 6, label = 'Loading', delayMs = 150, className }: LoadingStateProps) {
  const [show, setShow] = useState(delayMs === 0)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const a = window.setTimeout(() => setShow(true), delayMs)
    const b = window.setTimeout(() => setSlow(true), 2000)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
  }, [delayMs])
  if (!show) return <div className={className} aria-busy="true" />
  const bar = 'rounded-sm bg-surface-sunken'
  return (
    <div role="status" aria-busy="true" className={cx('flex flex-col gap-2 p-pane', className)}>
      <span className="text-sm text-fg-subtle">{label}{slow ? '. Still working' : ''}</span>
      {slow && <span className="h-0.5 w-full bg-surface-sunken"><span className="block h-full w-1/3 bg-accent" /></span>}
      {variant === 'tile' && <span className={cx(bar, 'h-8 w-24')} />}
      {variant === 'block' && <><span className={cx(bar, 'h-5 w-1/3')} /><span className={cx(bar, 'h-24 w-full')} /><span className={cx(bar, 'h-24 w-full')} /></>}
      {variant === 'rows' && Array.from({ length: rows }, (_, i) => (
        <span key={i} className="flex h-row items-center gap-gap"><span className={cx(bar, 'h-3 w-4')} /><span className={cx(bar, 'h-chip w-16')} /><span className={cx(bar, 'h-3 flex-1')} /><span className={cx(bar, 'h-3 w-20')} /></span>
      ))}
    </div>
  )
}

export interface ErrorStateProps {
  /** What failed, e.g. "Telemetry feed lost 14:06". */
  title: string
  /** What still works and what to do, e.g. "Showing data as of 14:05." */
  detail?: ReactNode
  onRetry?: () => void
  /** Reference id, shown in mono. */
  refId?: string
  /** Compact single-line form for a row or tile. */
  inline?: boolean
  /** Blocking errors announce with role="alert"; others use role="status". */
  blocking?: boolean
  className?: string
}
/** Inline first (row, tile), then pane, then page. Never blank a pane on error. */
export function ErrorState({ title, detail, onRetry, refId, inline, blocking, className }: ErrorStateProps) {
  useEffect(() => {
    // `r` is Reassign everywhere else (lib/keys.ts), so it only means Retry on a blocking error that has replaced the screen.
    if (!onRetry || !blocking) return
    const h = (e: KeyboardEvent) => { if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) onRetry() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onRetry, blocking])
  return (
    <div role={blocking ? 'alert' : 'status'} className={cx('flex gap-gap rounded-md border border-line-strong bg-surface p-pad', inline ? 'items-center' : 'flex-col items-start p-pane', className)}>
      <div className="flex min-w-0 items-start gap-2">
        <Icon name="alert" className="mt-0.5 text-fg-muted" label="Error" />
        <div className="min-w-0">
          <p className="text-base font-medium text-fg">{title}</p>
          {detail && <p className="text-base text-fg-muted">{detail}</p>}
          {refId && <p className="mono text-sm text-fg-subtle">Ref {refId}</p>}
        </div>
      </div>
      {onRetry && <Button variant="secondary" onClick={onRetry} hint={blocking ? 'r' : undefined} icon={<Icon name="retry" />} className={inline ? 'ml-auto' : undefined}>Retry</Button>}
    </div>
  )
}
