import { Link } from 'react-router-dom'
import { Avatar, FlagPill, Icon, Pill, RouteMap, SeverityChip, StatusMarker } from '../../components'
import type { IncidentDetail, IncidentRow } from '../../lib/queries'
import { getOperator } from '../../lib/queries'
import type { MapMarker } from '../../data/types'
import { fmtNum, fmtRel, fmtDateTime } from '../../lib/time'
import { cx } from '../../lib/cx'

function Card({ title, meta, children, label }: { title: string; meta?: React.ReactNode; children: React.ReactNode; label?: string }) {
  return (
    <section aria-label={label ?? title} className="rounded-md border border-line bg-surface">
      <div className="flex min-h-row items-center gap-2 border-b border-line px-pane py-1">
        <h2 className="text-md font-medium text-fg">{title}</h2>
        {meta && <div className="ml-auto text-sm text-fg-subtle">{meta}</div>}
      </div>
      <div className="p-pane">{children}</div>
    </section>
  )
}
const LinkRow = ({ to, children, mono }: { to: string; children: React.ReactNode; mono?: boolean }) => (
  <Link to={to} className={cx('inline-flex items-center gap-1 rounded-xs text-fg-link hover:underline', mono && 'font-mono')}>{children}</Link>
)
const KV = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex min-h-hit items-baseline gap-2 text-base"><dt className="w-kv shrink-0 text-sm text-fg-subtle">{k}</dt><dd className="min-w-0 flex-1">{children}</dd></div>
)

export function ContextPanel({ d, markers, selected, onSelect, related, here }: {
  d: IncidentDetail; markers: MapMarker[]; selected: string | null; onSelect: (id: string | null) => void; related: IncidentRow[]; here: string
}) {
  const inc = d.incident
  const drive = d.drives[0]
  const operator = drive ? getOperator(drive.operatorId) : undefined
  const from = `?from=${encodeURIComponent(here)}`
  const repairs = d.vehicles.flatMap((v) => v.repairs.map((r) => ({ ...r, vehicleLabel: v.id })))
  const shown = related.slice(0, 5)
  return (
    <aside aria-label="Context" className="flex min-h-0 w-side shrink-0 flex-col gap-gap overflow-auto border-l border-line p-pane">
      <Card title="Location" meta={d.hazard ? `${d.hazard.state} hazard` : 'No hazard linked'}>
        <div className="h-map overflow-hidden rounded-sm border border-line">
          <RouteMap markers={markers} selectedId={selected} onSelect={onSelect} highlightId={d.hazard?.id} compactChrome className="h-full" />
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          {d.hazard ? <>Hazard <span className="font-medium text-fg">{d.hazard.label}</span> · {d.tags.length} tag{d.tags.length === 1 ? '' : 's'} here · <LinkRow to={`/fleet?hazard=${d.hazard.id}`} mono>{d.hazard.id}</LinkRow></> : 'Tags are shown without a mapped hazard.'}
        </p>
      </Card>

      <Card title="Vehicle and drive" meta={d.vehicles.length > 1 ? `${d.vehicles.length} vehicles` : undefined}>
        <dl className="flex flex-col">
          {d.vehicles.map((v) => (
            <KV key={v.id} k="Vehicle">
              <div className="flex flex-wrap items-center gap-2">
                <LinkRow to={`/fleet?vehicle=${v.id}`} mono>{v.id}</LinkRow>
                {v.nickname && <span className="text-fg-muted">{v.nickname}</span>}
                <Pill>{v.status}</Pill>
              </div>
              <p className="text-sm text-fg-muted">{v.build} · {fmtNum(v.eventsToday)} events today</p>
            </KV>
          ))}
          {d.drives.map((dr) => (<KV key={dr.id} k="Drive"><LinkRow to={`/fleet?drive=${dr.id}`} mono>{dr.id}</LinkRow> <span className="text-sm text-fg-muted">{dr.state}, {fmtDateTime(dr.start)}</span></KV>))}
          <KV k="Operator">
            {operator ? <span className="inline-flex items-center gap-2"><Avatar initials={operator.initials} /><LinkRow to={`/fleet?operator=${operator.id}`}>{operator.name}</LinkRow></span> : <span className="text-fg-muted">Unknown</span>}
          </KV>
          <KV k="Shift"><span className="text-fg">{inc.shiftName}</span> <span className="text-sm text-fg-muted">· {d.reporter ? `reported by ${d.reporter.name}` : ''}</span></KV>
        </dl>
      </Card>

      <Card title="Footage review" meta="Audited for every incident">
        {d.footage ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2"><StatusMarker status={d.footage.status} flags={d.footage.flags} /><span className="font-mono text-sm text-fg-muted">{d.footage.id}</span></div>
            <p className="text-sm text-fg-muted">Segment <span className="font-mono">{d.footage.segment}</span> · due {fmtRel(d.footage.due)}</p>
            <LinkRow to={`/review?sel=${d.footage.id}`}>Open in Review <Icon name="external" className="size-3" /></LinkRow>
          </div>
        ) : <p className="text-sm text-fg-muted">No footage review yet. One is created when the incident is opened.</p>}
      </Card>

      <Card title="Repairs" meta="Read-only">
        {repairs.length === 0 ? <p className="text-sm text-fg-muted">No repairs on {d.vehicles.map((v) => v.id).join(', ')}.</p> : (
          <ul className="flex flex-col gap-2">
            {repairs.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-base">
                <SeverityChip sev={r.sev} dot />
                <span className="min-w-0 flex-1 truncate" title={r.part}>{r.part}</span>
                <StatusMarker status={r.status} variant="compact" />
                <span className="text-sm text-fg-subtle">{r.technician ?? 'No technician'}</span>
              </li>
            ))}
            {repairs.length > 4 && <li className="text-sm text-fg-subtle">+{repairs.length - 4} more on the vehicle page</li>}
          </ul>
        )}
      </Card>

      <Card title="Related incidents" meta={related.length ? `${related.length}` : undefined}>
        {shown.length === 0 ? <p className="text-sm text-fg-muted">No other incidents on this vehicle or hazard.</p> : (
          <ul className="-mx-2 flex flex-col">
            {shown.map((r) => (
              <li key={r.id}>
                <Link to={`/incidents/${r.id}${from}`} className="flex min-h-row items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-hover">
                  <SeverityChip sev={r.sev} proposed={r.sevProposed} dot />
                  <span className="font-mono text-sm text-fg-muted">{r.id}</span>
                  <span className="min-w-0 flex-1 truncate text-base text-fg" title={r.title}>{r.title}</span>
                  {r.flags.includes('Stale') && <FlagPill flag="Stale" />}
                  <StatusMarker status={r.status} variant="compact" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {related.length > shown.length && <p className="mt-1 text-sm text-fg-subtle">+{related.length - shown.length} more</p>}
      </Card>
    </aside>
  )
}
