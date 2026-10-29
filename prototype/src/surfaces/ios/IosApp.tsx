import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { useSimNow } from '../../lib/clock'
import { fmtTime } from '../../lib/time'
import './ios.css'
import Escalations from './Escalations'
import IncidentRead from './IncidentRead'
import InboxTab from './InboxTab'
import LockScreen from './LockScreen'
import MeTab from './MeTab'
import NowTab from './NowTab'
import Takeover from './Takeover'
import { ToastHost } from './parts'

const usePrefersDark = () => {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => setDark(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return dark
}

function StatusBar({ onDark }: { onDark: boolean }) {
  const now = useSimNow(30000)
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-8 text-md font-semibold ${onDark ? 'text-n-0' : 'text-fg'}`}>
      <span className="w-20 text-center">{fmtTime(now)}</span>
      <span className="flex w-20 items-center justify-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-3 w-4.5" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.8" /><rect x="5" y="5.5" width="3" height="6.5" rx="0.8" /><rect x="10" y="3" width="3" height="9" rx="0.8" /><rect x="15" y="0" width="3" height="12" rx="0.8" /></svg>
        <svg viewBox="0 0 27 13" className="h-3 w-7" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" /><rect x="2" y="2" width="16" height="9" rx="2" fill="currentColor" stroke="none" /><path d="M24.5 4.5v4" strokeLinecap="round" /></svg>
      </span>
    </div>
  )
}

export default function IosApp() {
  const [sp] = useSearchParams()
  const loc = useLocation()
  const prefersDark = usePrefersDark()
  const q = sp.get('theme')
  const theme = q === 'dark' || q === 'light' ? q : prefersDark ? 'dark' : 'light'
  const bare = sp.get('frame') === '0'
  const isLock = loc.pathname.replace(/\/$/, '').endsWith('/ios/lock')
  return (
    <div data-surface="ios" data-theme={theme} data-bare={bare} className="ios-canvas">
      <div className="flex items-center gap-8">
      <div className="ios-bezel">
        <div className="ios-phone" role="application" aria-label="Plumb for iPhone">
          {!bare && <span className="ios-island" aria-hidden />}
          {!bare && <StatusBar onDark={isLock} />}
          <ToastHost>
            <Routes>
              <Route index element={<Navigate to={`esc${loc.search}`} replace />} />
              <Route path="esc" element={<Escalations />} />
              <Route path="esc/:id" element={<Takeover />} />
              <Route path="now" element={<NowTab />} />
              <Route path="inbox" element={<InboxTab />} />
              <Route path="me" element={<MeTab />} />
              <Route path="inc/:id" element={<IncidentRead />} />
              <Route path="lock" element={<LockScreen />} />
              <Route path="*" element={<Navigate to={`esc${loc.search}`} replace />} />
            </Routes>
          </ToastHost>
          {!bare && !isLock && <span className="ios-indicator" aria-hidden />}
        </div>
      </div>
      {!bare && <PresenterNotes search={loc.search} />}
      </div>
    </div>
  )
}

/** Presenter notes: portfolio navigation that lives on the canvas, outside the phone frame. */
function PresenterNotes({ search }: { search: string }) {
  const q = new URLSearchParams(search)
  ;['demo'].forEach((k) => q.delete(k))
  const qs = q.toString() ? `?${q.toString()}` : ''
  const links = [
    { to: `/ios/esc${qs}`, label: 'Escalations home' },
    { to: `/ios/esc/ESC-0206${qs}`, label: 'Takeover (SEV1)' },
    { to: `/ios/lock${qs}`, label: 'Lock-screen alert' },
  ]
  return (
    <aside aria-label="Presenter notes" className="hidden w-56 flex-col gap-2 text-sm text-fg-muted lg:flex">
      <p className="caps">Presenter notes</p>
      <p>Plumb for iPhone. Lead-first: acknowledge in one tap, then work the protocol. Sample data is invented.</p>
      <ul className="flex flex-col">
        {links.map((l) => <li key={l.to}><Link to={l.to} className="inline-flex h-(--spacing-target) items-center text-fg-link underline-offset-2 hover:underline">{l.label}</Link></li>)}
      </ul>
    </aside>
  )
}
