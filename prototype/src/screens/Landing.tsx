import { Link } from 'react-router-dom'

const SURFACES = [
  { to: '/now', label: 'Desktop console', note: 'Ops lead, 1440 px' },
  { to: '/ios', label: 'iPhone', note: 'Field triage' },
  { to: '/vehicle', label: 'In-vehicle', note: 'Safety driver, glanceable' },
]
const linkCls = 'rounded-sm text-fg-link underline underline-offset-4 hover:text-accent-hover'

/** Presenter landing at `/`. Calm, small, three doors. */
export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 bg-canvas px-pane py-10 text-fg">
      <h1 className="text-xl font-semibold">Fleet Console: a concept re-creation</h1>
      <p className="text-md text-fg-muted">A self-initiated concept at Woven by Toyota, re-created under NDA with invented data.</p>
      <nav aria-label="Surfaces" className="flex flex-col gap-2">
        {SURFACES.map((s) => (
          <Link key={s.to} to={s.to} className="flex items-baseline justify-between rounded-lg border border-line bg-surface px-4 py-4 hover:bg-surface-hover">
            <span className="text-lg font-semibold">{s.label}</span>
            <span className="text-base text-fg-subtle">{s.note}</span>
          </Link>
        ))}
      </nav>
      <p className="flex flex-wrap gap-4 text-base">
        <a className={linkCls} href="https://apoorvsm01.github.io/portfolio/work/fleet-console">Case study</a>
        <a className={linkCls} href="https://github.com/Apoorvsm01/fleet-console">GitHub repo</a>
        <Link className={linkCls} to="/specimen">Specimen</Link>
      </p>
    </main>
  )
}
