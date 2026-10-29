import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { fmtKey } from '../lib/keys'

/** Keyboard hint, drawn in the UI sans (not mono: mono "r" and "l" read as other glyphs at 11px). `<Kbd>g</Kbd><Kbd>n</Kbd>` */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx('inline-flex min-w-5 items-center justify-center rounded-xs border border-line bg-surface-sunken px-1 font-sans text-xs font-medium text-fg-muted', className)}>{children}</kbd>
}
/** A key sequence from lib/keys notation: `<KeyCombo keys={['mod','k']} />` shows ⌘ K on Mac and Ctrl K elsewhere. */
export function KeyCombo({ keys, className }: { keys: string[]; className?: string }) {
  return <span className={cx('inline-flex items-center gap-px', className)}>{keys.map((k, i) => <Kbd key={i}>{fmtKey(k)}</Kbd>)}</span>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Shortcut hint shown as a kbd inside the button. */
  hint?: string
  /** When disabled, why (shown as tooltip via title and announced). */
  disabledReason?: string
  icon?: ReactNode
}
/** Button. Height follows density (h-ctl). Plain verbs for labels. */
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = 'secondary', hint, disabledReason, icon, className, children, disabled, title, ...rest }, ref) {
  const v = {
    primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover border border-transparent',
    secondary: 'bg-surface text-fg border border-line-strong hover:bg-surface-hover',
    ghost: 'bg-transparent text-fg border border-transparent hover:bg-surface-hover',
  }[variant]
  return (
    <button ref={ref} type="button" disabled={disabled} aria-disabled={disabled || undefined} title={disabled && disabledReason ? disabledReason : title}
      className={cx('inline-flex h-ctl min-w-hit shrink-0 items-center justify-center gap-2 rounded-sm px-pad text-base font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-fg-disabled disabled:hover:bg-surface-sunken', v, className)} {...rest}>
      {icon}{children}{hint && <Kbd className="ml-1">{hint}</Kbd>}
    </button>
  )
})

/** Square icon-only button; `label` is required for accessibility. */
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean }>(function IconButton({ label, pressed, className, children, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} aria-pressed={pressed}
      className={cx('inline-flex size-ctl shrink-0 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-hover hover:text-fg', pressed && 'bg-accent-subtle text-accent-subtle-fg', className)} {...rest}>
      {children}
    </button>
  )
})

/** Hover/focus tooltip. Wrap the trigger; `tip` can include <Kbd>. Not for essential info. */
export function Tip({ tip, children, className }: { tip: ReactNode; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <span className={cx('group/tip relative inline-flex', className)} aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="pointer-events-none absolute top-full left-0 z-40 mt-1 hidden w-max max-w-64 rounded-md bg-surface-raised px-2 py-1 text-sm text-fg shadow-2 group-hover/tip:block group-focus-within/tip:block">{tip}</span>
    </span>
  )
}

/** Person avatar: initials in a neutral circle. Never uses severity or flag hues. */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return <span aria-hidden className={cx('inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-fg-muted', className)}>{initials}</span>
}

/** Neutral text pill (count, scope). */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex h-chip items-center rounded-sm border border-line px-2 text-sm text-fg-muted', className)}>{children}</span>
}

/** Pane title row used by screens: title, optional meta, actions on the right. */
export function PaneHeader({ title, meta, actions, className }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex min-h-row items-center gap-gap border-b border-line px-pane py-2', className)}>
      <h2 className="min-w-0 truncate text-md font-medium text-fg">{title}</h2>
      {meta && <div className="text-sm text-fg-subtle">{meta}</div>}
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </div>
  )
}
