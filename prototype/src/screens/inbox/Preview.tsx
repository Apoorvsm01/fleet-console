import { Link } from 'react-router-dom'
import { SeverityChip, StatusMarker, Timeline } from '../../components'
import { Avatar, Button, Kbd } from '../../components/ui'
import { getIncident, getLeads, getIssueTags, getTimeline, personName, type InboxRow } from '../../lib/queries'
import { COPY } from '../../lib/copy'
import { keyOf } from '../../lib/keys'
import { fmtDateTime, fmtRel } from '../../lib/time'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="caps text-fg-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-base text-fg">{children}</dd>
    </div>
  )
}

export interface PreviewProps {
  row: InboxRow
  onSeverity: (r: InboxRow, sev: 1 | 2 | 3) => void
  onAssign: (r: InboxRow, ownerId: string) => void
  onTriage: (r: InboxRow) => void
  onDismiss: (r: InboxRow) => void
}

export function Preview({ row, onSeverity, onAssign, onTriage, onDismiss }: PreviewProps) {
  const detail = row.incidentId ? getIncident(row.incidentId) : undefined
  const tag = row.kind === 'tag' ? getIssueTags().find((t) => t.id === row.id) : undefined
  const events = row.incidentId ? getTimeline(row.incidentId) : []
  const canTriage = row.kind === 'tag' || row.status === 'Captured'
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-1 border-b border-line px-pane py-2">
        <span className="whitespace-nowrap font-mono text-sm text-fg-subtle">{row.id}</span>
        <h2 className="line-clamp-2 text-md font-medium text-fg" title={row.title}>{row.title}</h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-gap overflow-auto p-pane">
        <div className="flex flex-wrap items-center gap-gap">
          <SeverityChip sev={row.sev} proposed={row.proposed} onChange={(s) => onSeverity(row, s)} />
          <StatusMarker status={row.status} flags={row.flags} variant="inline" />
          {row.kind === 'tag' && <span className="text-sm text-fg-subtle">Untriaged tag: severity is proposed from tag type</span>}
        </div>
        <dl className="grid grid-cols-2 gap-x-pane gap-y-gap">
          <Fact label="Vehicle"><span className="font-mono">{row.vehicleId}</span></Fact>
          <Fact label="Raised">{fmtDateTime(row.createdAt)} <span className="text-fg-subtle">({fmtRel(row.createdAt)})</span></Fact>
          <Fact label="Shift">{COPY.shiftName[row.shiftId as keyof typeof COPY.shiftName] ?? row.shiftId}</Fact>
          <Fact label={row.kind === 'tag' ? 'Reported by' : 'Tags'}>{row.kind === 'tag' ? personName(tag?.operatorId) : `${row.tagCount.toLocaleString('en-US')} linked`}</Fact>
          {detail && <Fact label="Reporter">{personName(detail.incident.reporterId)}</Fact>}
          {tag && <Fact label="Location">{tag.locationLabel}</Fact>}
        </dl>
        <div className="flex flex-wrap items-end gap-gap">
          <label className="flex flex-col gap-1 caps text-fg-subtle">
            Owner
            <span className="flex items-center gap-2">
              {row.ownerId && <Avatar initials={personName(row.ownerId).split(' ').map((p) => p[0]).join('').slice(0, 2)} />}
              <select value={row.ownerId ?? ''} onChange={(e) => e.target.value && onAssign(row, e.target.value)}
                className="h-ctl min-w-48 rounded-sm border border-line-strong bg-surface px-2 text-base font-normal normal-case tracking-normal text-fg">
                <option value="">{COPY.unassigned}</option>
                {getLeads().map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </span>
          </label>
          {row.incidentId && <Link className="inline-flex h-ctl items-center rounded-sm border border-line-strong px-pad text-base text-fg-link hover:bg-surface-hover" to={`/incidents/${row.incidentId}`}>Open incident</Link>}
          {canTriage && <Button variant="primary" hint={keyOf('triage')} onClick={() => onTriage(row)}>{row.kind === 'tag' ? 'Create incident' : 'Mark triaged'}</Button>}
          {row.kind === 'tag' && <Button hint={keyOf('dismiss')} onClick={() => onDismiss(row)}>Dismiss</Button>}
        </div>
        {events.length > 0 ? (
          <section aria-label="Recent activity" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-fg-muted">Activity</h3>
            <Timeline events={events} variant="compact" showNow={false} />
          </section>
        ) : (
          <p className="text-sm text-fg-subtle">No incident yet. Press <Kbd>{keyOf('triage')}</Kbd> to create one from this tag.</p>
        )}
      </div>
    </div>
  )
}
