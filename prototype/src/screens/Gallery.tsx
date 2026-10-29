import { COPY } from '../lib/copy'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CoverageBar, DataTable, DriveStrip, EmptyState, ErrorState, EscalationCard, FilterBar, FlagPill, LoadingState, MetricTile, RouteMap, SeverityChip, SplitPane,
  StatusMarker, Timeline, filterRows, type Column, type FilterField,
} from '../components'
import { acknowledgeEscalation, handOffEscalation, useStore } from '../lib/store'
import { getCoverage, getEscalations, getIncident, getInbox, getMapMarkers, getNow, getSavedViews, type InboxRow } from '../lib/queries'
import { useQueryState } from '../lib/useQueryState'
import { fmtRel, fmtNum } from '../lib/time'
import { PaneHeader } from '../components/ui'

const FIELDS: FilterField<InboxRow>[] = [
  { key: 'sev', label: 'Severity', values: [{ value: '1', label: 'SEV1' }, { value: '2', label: 'SEV2' }, { value: '3', label: 'SEV3' }], match: (r, v) => v.includes(String(r.sev)) },
  { key: 'kind', label: 'Kind', values: [{ value: 'tag', label: 'Tag' }, { value: 'incident', label: 'Incident' }], match: (r, v) => v.includes(r.kind) },
  { key: 'owner', label: 'Owner', values: [{ value: 'none', label: 'Unowned' }], match: (r, v) => (v.includes('none') ? !r.ownerId : v.includes((r.ownerId ?? '').toLowerCase())) },
  { key: 'shift', label: 'Shift', values: [{ value: 'am', label: 'AM' }, { value: 'pm', label: 'PM' }, { value: 'gy', label: 'Night' }], match: (r, v) => v.includes(r.shiftId.toLowerCase()) },
]

/** Living kitchen sink at /gallery. Shows every shared component with fixture data, including edge cases. Not a product screen. */
export default function Gallery() {
  useStore()
  const nav = useNavigate()
  const [q, setQ] = useQueryState('q')
  const [view, setView] = useQueryState('view')
  const [sel, setSel] = useState<string | null>(null)
  const [mapSel, setMapSel] = useState<string | null>(null)
  const rows = useMemo(() => filterRows(getInbox('team'), q, FIELDS, (r) => `${r.title} ${r.id} ${r.vehicleId}`), [q])
  const cols: Column<InboxRow>[] = [
    { key: 'sev', header: 'Sev', width: 24, cell: (r) => <SeverityChip sev={r.sev} proposed={r.proposed} />, sortValue: (r) => r.sev },
    { key: 'id', header: 'ID', width: 24, mono: true, cell: (r) => r.id, sortValue: (r) => r.id },
    { key: 'title', header: 'Title', cell: (r) => r.title, sortValue: (r) => r.title },
    { key: 'status', header: 'Status', width: 48, cell: (r) => <StatusMarker status={r.status} flags={r.flags} /> },
    { key: 'age', header: 'Age', width: 16, align: 'right', cell: (r) => fmtRel(r.createdAt), sortValue: (r) => r.createdAt },
  ]
  const detail = sel ? getIncident(sel) : undefined
  const now = getNow()
  return (
    <div className="flex flex-col gap-gap p-pane">
      <h1 className="text-lg font-semibold">Plumb gallery</h1>
      <section className="flex flex-wrap items-center gap-gap">
        {[1, 2, 3].map((s) => <SeverityChip key={s} sev={s as 1 | 2 | 3} />)}
        {[1, 2, 3].map((s) => <SeverityChip key={s} sev={s as 1 | 2 | 3} proposed />)}
        {[1, 2, 3].map((s) => <SeverityChip key={s} sev={s as 1 | 2 | 3} dot />)}
        <SeverityChip sev={2} onChange={() => {}} />
        {(['Captured', 'Triaged', 'Owned', 'Resolved', 'Verified'] as const).map((s) => <StatusMarker key={s} status={s} />)}
        <FlagPill flag="Escalated" /><FlagPill flag="Overdue" age="2d" /><FlagPill flag="Stale" />
      </section>
      <StatusMarker variant="block" status="Resolved" flags={['Overdue']} steps={{ Captured: { by: 'Rowan A.', at: '09:12' }, Resolved: { by: 'Devika Raman', at: '13:40' } }} onAdvance={() => {}} advanceDisabledReason="Resolver cannot verify" />
      <section className="grid grid-cols-4 gap-gap">
        <MetricTile hero label="Oversight debt" value={now.programDebt.current.total} delta={{ value: now.programDebt.current.total - (now.programDebt.previous?.total ?? 0), text: 'vs last shift' }} sparkline={now.programDebt.history} to="/inbox" footer="See queues" definition="Footage to review + incidents to triage + re-routed escalations + coverage gaps." />
        <MetricTile label={COPY.debt.rerouted} value={0} to="/now" footer="0 items" />
        <MetricTile label="Night ODD" value="" ratio={{ achieved: 31, target: 60 }} unit="h" />
        <MetricTile label="Drives logged" value={fmtNum(10412)} state="stale" staleLabel="Stale 14 m" />
        <MetricTile label="Data health" value="2 of 9" health="Degraded" />
        <MetricTile label="Footage" value={0} state="loading" />
        <MetricTile label="Error" value={0} state="error" onRetry={() => {}} />
        <MetricTile label="Telemetry" value={1} health="Failing" />
      </section>
      <CoverageBar segments={getCoverage()} onOpenShift={(id) => nav(`/plan?shift=${id}`)} />
      <section className="grid grid-cols-2 gap-gap">
        {getEscalations().filter((e) => e.active).map((v) => (
          <EscalationCard key={v.escalation.id} view={v} onAcknowledge={() => acknowledgeEscalation(v.escalation.id)} onHandOff={(to) => handOffEscalation(v.escalation.id, to)} />
        ))}
        {getEscalations().filter((e) => !e.active).slice(0, 1).map((v) => <EscalationCard key={v.escalation.id} view={v} variant="compact" />)}
      </section>
      <div className="flex h-(--spacing-side) flex-col border border-line">
        <FilterBar fields={FIELDS} query={q} onQueryChange={setQ} views={getSavedViews('inbox')} activeViewId={view || null}
          onViewChange={(id) => { setView(id ?? ''); setQ(getSavedViews('inbox').find((v) => v.id === id)?.query ?? '') }} resultCount={rows.length} totalCount={getInbox('team').length} />
        <SplitPane listLabel="Inbox" detailLabel="Preview"
          list={<DataTable ariaLabel="Inbox" columns={cols} rows={rows} rowKey={(r) => r.key} rowSev={(r) => r.sev} selectable groupBy={(r) => ({ key: String(r.sev), label: `SEV${r.sev}` })}
            onActiveChange={(k) => setSel(rows.find((r) => r.key === k)?.incidentId ?? null)} bulkActions={[{ key: 'd', label: 'Dismiss', run: () => () => {} }]}
            empty={<EmptyState variant="no-results" title="No matches" description={`Nothing matches "${q}".`} action={{ label: 'Clear filters', onClick: () => setQ('') }} />} />}
          detail={detail ? <div className="flex flex-col"><PaneHeader title={detail.incident.title} /><Timeline events={detail.timeline} onSelect={(e) => setMapSel(e.mapId ?? null)} /></div> : undefined} />
      </div>
      <section className="grid grid-cols-2 gap-gap">
        <RouteMap markers={getMapMarkers({ layers: ['tag', 'hazard', 'vehicle'] })} selectedId={mapSel} onSelect={setMapSel} />
        <div className="flex flex-col gap-gap">
          <DriveStrip tags={[{ id: 'a', pos: 0.2, sev: 2, label: 'Phantom brake' }, { id: 'b', pos: 0.7, sev: 1, label: 'Collision' }]} bands={[{ from: 0, to: 0.5, label: 'Day' }, { from: 0.5, to: 1, label: 'Dense traffic' }]} />
          <EmptyState variant="success" title="Nothing to triage" description="Last cleared 14:02." />
          <LoadingState rows={3} label="Loading footage" delayMs={0} />
          <ErrorState title="Telemetry feed lost 14:06" detail="Showing data as of 14:05." refId="ERR-4F2A91" onRetry={() => {}} />
        </div>
      </section>
    </div>
  )
}
