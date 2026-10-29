import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cx } from '../lib/cx'

type Surface = { key: 'desktop' | 'ios' | 'vehicle'; label: string; to: string }
/** Each surface opens on its hero state. */
const SURFACES: Surface[] = [
  { key: 'desktop', label: 'Desktop', to: '/now' },
  { key: 'ios', label: 'iPhone', to: '/ios' },
  { key: 'vehicle', label: 'In-vehicle', to: '/vehicle' },
]
export const surfaceOf = (pathname: string): Surface['key'] => (pathname.startsWith('/ios') ? 'ios' : pathname.startsWith('/vehicle') ? 'vehicle' : 'desktop')

/** Persistent surface switcher. Lives in its own bar above each surface so it never covers product UI and is never scaled. */
export function SurfaceSwitcher() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const cur = surfaceOf(pathname)
  return (
    <div data-switcher-bar className="relative z-60 flex h-(--switcher-h) shrink-0 items-center justify-center gap-gap border-b border-line bg-surface px-pane text-fg">
      <nav aria-label="Surface" className="flex items-center rounded-sm border border-line-strong bg-surface p-px">
        {SURFACES.map((s) => {
          const on = s.key === cur
          return (
            <button key={s.key} type="button" aria-current={on ? 'page' : undefined} onClick={() => { if (!on) nav(s.to) }}
              className={cx('inline-flex h-ctl items-center rounded-xs px-pad text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus', on ? 'bg-accent font-medium text-fg-on-accent' : 'text-fg-muted hover:bg-surface-hover')}>
              {s.label}
            </button>
          )
        })}
      </nav>
      <Link to="/" className="absolute right-pane inline-flex h-ctl items-center text-sm text-fg-link underline underline-offset-2">Overview</Link>
    </div>
  )
}

/** Column layout: switcher bar on top, surface below filling the rest. */
export function SurfaceChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <SurfaceSwitcher />
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  )
}
