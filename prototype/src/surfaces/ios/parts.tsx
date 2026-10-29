import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FlagPill, Icon, SeverityChip, sevEdgeClass } from '../../components'
import { COPY } from '../../lib/copy'
import { cx } from '../../lib/cx'
import { ms, fmtCountdown } from '../../lib/time'
import { getActiveEscalations, type EscalationView } from '../../lib/queries'

/* ---------- navigation that keeps ?theme= ?frame= ?empty= ---------- */
const KEEP = ['theme', 'frame', 'empty']
export function useIosNav() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const href = useCallback((path: string, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams()
    KEEP.forEach((k) => { const v = sp.get(k); if (v !== null) q.set(k, v) })
    Object.entries(extra).forEach(([k, v]) => q.set(k, v))
    const s = q.toString()
    return `/ios/${path}${s ? `?${s}` : ''}`
  }, [sp])
  return { href, go: (path: string, extra?: Record<string, string>) => nav(href(path, extra)), sp }
}
export function IosLink({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
  const { href } = useIosNav()
  return <Link to={href(to)} className={className} {...rest}>{children}</Link>
}

/* ---------- toast ---------- */
const ToastCtx = createContext<(m: string) => void>(() => {})
export const useIosToast = () => useContext(ToastCtx)
export function ToastHost({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number>(0)
  const show = useCallback((m: string) => {
    setMsg(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setMsg(null), 3000)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--spacing-tabbar)+var(--spacing-safe-bottom)+var(--spacing-gap))] z-40 flex justify-center px-pane">
        {msg && <div className="ios-sheet pointer-events-auto rounded-lg bg-fg px-pad py-3 text-sm text-canvas shadow-2" style={{ borderRadius: 'var(--radius-lg)' }}>{msg}</div>}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- controls ---------- */
export function CtaButton({ variant = 'primary', compact, className, children, reason, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary'; compact?: boolean; reason?: string }) {
  const disabled = !!reason || rest.disabled
  return (
    <button type="button" {...rest} aria-disabled={disabled || undefined} onClick={disabled ? undefined : rest.onClick} title={reason}
      className={cx('ios-press flex w-full', compact ? 'h-(--spacing-target)' : 'h-(--spacing-cta)', ' items-center justify-center gap-2 rounded-md px-pad text-md font-semibold',
        disabled ? 'bg-surface-sunken text-fg-disabled' : variant === 'primary' ? 'bg-accent text-fg-on-accent' : 'border border-line-strong bg-surface text-fg', className)}>
      {children}
    </button>
  )
}
export function TextLink({ children, icon, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string }) {
  return (
    <button type="button" {...rest} className="ios-press inline-flex h-(--spacing-target) items-center gap-2 rounded-md px-pad text-base text-fg-link">
      {icon && <Icon name={icon} />}{children}
    </button>
  )
}
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md bg-surface-sunken p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}
          className={cx('ios-press h-9 flex-1 rounded-sm text-sm font-medium', o.value === value ? 'bg-surface text-fg shadow-1' : 'text-fg-muted')}>{o.label}</button>
      ))}
    </div>
  )
}

/* ---------- screen scaffold ---------- */
export type TabKey = 'esc' | 'now' | 'inbox' | 'me'
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'esc', label: 'Escalations', icon: 'alert' },
  { key: 'now', label: 'Now', icon: 'now' },
  { key: 'inbox', label: 'Inbox', icon: 'inbox' },
  { key: 'me', label: 'Me', icon: 'user' },
]
export const needsMe = () => getActiveEscalations().filter((v) => v.isMine && v.escalation.state !== 'Acknowledged').length

export function TabBar({ active }: { active: TabKey }) {
  const { href } = useIosNav()
  const { sp } = useIosNav()
  const badge = sp.get('empty') === '1' ? 0 : needsMe()
  return (
    <nav aria-label="Tabs" className="hairline-t absolute inset-x-0 bottom-0 z-30 flex bg-surface-glass pb-(--spacing-safe-bottom) backdrop-blur-md">
      {TABS.map((t) => {
        const on = t.key === active
        return (
          <Link key={t.key} to={href(t.key)} aria-current={on ? 'page' : undefined}
            className={cx('ios-press relative flex h-(--spacing-tabbar) min-w-0 flex-1 flex-col items-center justify-center gap-0.5', on ? 'text-accent' : 'text-(--color-tab-inactive)')}>
            <span className="relative">
              <Icon name={t.icon} className="size-6" />
              {t.key === 'esc' && badge > 0 && <span className="absolute -top-1.5 left-3.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sev1-mark px-1 text-xs font-semibold leading-none text-on-sev1" aria-label={`${badge} need you`}>{badge}</span>}
            </span>
            <span className="text-xs font-medium">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Screen({ title, subtitle, large = true, back, trailing, tab, footer, anim, children, scrollRef }: {
  title: string; subtitle?: ReactNode; large?: boolean; back?: { label: string; to: string }; trailing?: ReactNode; tab?: TabKey
  footer?: ReactNode; anim?: 'push' | 'cover'; children: ReactNode; scrollRef?: React.RefObject<HTMLDivElement | null>
}) {
  const [scrolled, setScrolled] = useState(false)
  const { href } = useIosNav()
  const collapsed = !large || scrolled
  return (
    <div className={cx('absolute inset-0 flex flex-col bg-canvas', anim === 'push' && 'ios-push', anim === 'cover' && 'ios-cover')}>
      <div ref={scrollRef} data-scroll className="ios-scroll min-h-0 flex-1 overflow-y-auto" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 28)}>
        <header className={cx('sticky top-0 z-20 pt-safe', collapsed ? 'hairline-b bg-surface-glass backdrop-blur-md' : '')}>
          <div className="relative flex h-(--spacing-navbar) items-center justify-between px-2">
            <div className="z-10 flex min-w-0 items-center">
              {back && <Link to={href(back.to)} className="ios-press flex h-(--spacing-target) items-center gap-1 rounded-md pr-pad pl-2 text-md text-fg-link"><Icon name="left" className="size-5" />{back.label}</Link>}
            </div>
            <h1 className={cx('pointer-events-none absolute inset-x-24 truncate text-center text-md font-semibold text-fg', collapsed ? 'opacity-100' : 'opacity-0')} aria-hidden={!collapsed}>{title}</h1>
            <div className="z-10 flex items-center">{trailing}</div>
          </div>
        </header>
        {large && (
          <div className="px-pane pb-2">
            <h1 className="t-largetitle font-bold text-fg">{title}</h1>
            {subtitle && <p className="t-subhead text-fg-muted">{subtitle}</p>}
          </div>
        )}
        <div className={tab ? 'pb-[calc(var(--spacing-tabbar)+var(--spacing-safe-bottom)+var(--spacing-pane))]' : footer ? 'pb-pane' : 'pb-[calc(var(--spacing-safe-bottom)+var(--spacing-pane))]'}>{children}</div>
      </div>
      {footer && <div className="hairline-t shrink-0 bg-surface-glass px-pane pt-3 pb-[calc(var(--spacing-safe-bottom)+var(--spacing-gap))] backdrop-blur-md">{footer}</div>}
      {tab && <TabBar active={tab} />}
    </div>
  )
}

/** Inset-grouped section. */
export function Group({ title, children, footer, className }: { title?: string; children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <section className={cx('mt-4 px-pane', className)}>
      {title && <h2 className="caps px-2 pb-1.5 text-fg-muted">{title}</h2>}
      <div className="overflow-hidden rounded-lg bg-surface">{children}</div>
      {footer && <p className="px-2 pt-1.5 text-sm text-fg-muted">{footer}</p>}
    </section>
  )
}

/* ---------- sheet (medium detent, slide-up) ---------- */
export function Sheet({ title, onClose, action, children, tall }: { title: string; onClose: () => void; action?: ReactNode; children: ReactNode; tall?: boolean }) {
  const [closing, setClosing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  const close = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { onClose(); return }
    setClosing(true); window.setTimeout(onClose, 200)
  }, [onClose])
  useEffect(() => {
    opener.current = document.activeElement
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() ?? ref.current?.focus()
    return () => { (opener.current as HTMLElement | null)?.focus?.() }
  }, [])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return }
    if (e.key !== 'Tab') return
    const f = ref.current?.querySelectorAll<HTMLElement>('button:not([aria-disabled="true"]),textarea,input:not(:disabled),a[href]')
    if (!f || f.length === 0) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  return (
    <div className="absolute inset-0 z-40" onKeyDown={onKey}>
      <div className="ios-scrim absolute inset-0 bg-scrim" data-closing={closing} onClick={close} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={cx('ios-sheet absolute inset-x-0 bottom-0 flex flex-col bg-surface outline-none', tall ? 'h-[72%]' : 'max-h-[72%]')} data-closing={closing}>
        <div className="flex justify-center pt-2"><span className="ios-grabber" /></div>
        <div className="relative flex h-(--spacing-navbar) shrink-0 items-center justify-between px-2">
          <button type="button" onClick={close} className="ios-press h-(--spacing-target) rounded-md px-pad text-md text-fg-link">Cancel</button>
          <h2 className="pointer-events-none absolute inset-x-24 truncate text-center text-md font-semibold text-fg">{title}</h2>
          <div>{action}</div>
        </div>
        <div className="ios-scroll min-h-0 flex-1 overflow-y-auto pb-[calc(var(--spacing-safe-bottom)+var(--spacing-gap))]">{children}</div>
      </div>
    </div>
  )
}

/* ---------- EscalationRow ---------- */
export function EscalationRow({ view, now, onOpen }: { view: EscalationView; now: number; onOpen: () => void }) {
  const e = view.escalation
  const inc = view.incident
  const live = view.active
  const remaining = e.deadline ? ms(e.deadline) - now : undefined
  const handled = e.state === 'Handled'
  const acked = e.state === 'Acknowledged'
  const role = view.chain[e.currentIndex]?.link.role
  const sub = live
    ? `Waiting on ${view.isMine ? 'you' : view.current.name}`
    : acked ? `Acknowledged by ${view.chain.find((c) => c.person.id === e.ackBy)?.person.name ?? 'a lead'}`
    : `Handled by ${e.ackBy ? view.chain.find((c) => c.person.id === e.ackBy)?.person.name ?? e.ackBy : 'a lead'}`
  return (
    <button type="button" onClick={onOpen} aria-label={`${e.id}, SEV${inc.sev}, ${inc.title}. ${sub}`}
      className={cx('ios-press relative flex min-h-row w-full items-start gap-gap py-3 pr-pad pl-pad text-left', handled && 'text-fg-muted')}>
      <span aria-hidden className={cx('absolute inset-y-0 left-0', sevEdgeClass(inc.sev))} />
      <span className={cx('mt-0.5', live && inc.sev === 1 && 'sev-ring rounded-sm')}><SeverityChip sev={inc.sev} /></span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cx('line-clamp-2 text-md [overflow-wrap:anywhere]', handled ? 'font-normal' : 'font-semibold text-fg')}>{inc.title}</span>
        <span className="t-subhead text-fg-muted [overflow-wrap:anywhere]"><span className="font-mono text-sm">{inc.id}</span> · <span className="font-mono text-sm">{inc.vehicleLabel}</span></span>
        <span className="t-subhead text-fg-muted [overflow-wrap:anywhere]">{sub}</span>
        {e.state === 'Timed out' && (
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5"><FlagPill flag="Escalated" /><span className="text-sm text-fg-muted">Re-routed to {view.isMine ? 'you' : COPY.escalation.chainRole[role ?? 'Backup (rota)']}</span></span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 self-center">
        {remaining !== undefined && live ? (
          <span className="flex flex-col items-end"><span className={cx('font-mono text-md font-semibold', remaining < 60_000 ? 'text-sev1-fg' : 'text-fg')}>{fmtCountdown(remaining)}</span><span className="text-xs text-fg-subtle">left</span></span>
        ) : handled ? <Icon name="check" label="Handled" className="text-status-done" /> : <span className="text-sm text-fg-muted">Acked</span>}
        <Icon name="right" className="text-fg-subtle" />
      </span>
    </button>
  )
}

export const Divider = () => <div className="hairline-b ml-pad" />
