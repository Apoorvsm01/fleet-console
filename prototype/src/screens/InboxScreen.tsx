import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DataTable, EmptyState, FilterBar, FlagPill, SeverityChip, SplitPane, StatusMarker, filterRows,
  type Column, type FilterField, type SplitPaneHandle,
} from '../components'
import { Kbd, Tip } from '../components/ui'
import { useApp } from '../lib/app'
import { ME_ID, getInbox, getPerson, getSavedViews, personName, type InboxRow } from '../lib/queries'
import { useStore } from '../lib/store'
import { useDwell, useQueryState } from '../lib/useQueryState'
import { fmtAge, ageMin, fmtNum } from '../lib/time'
import { cx } from '../lib/cx'
import { COPY } from '../lib/copy'
import { keyOf } from '../lib/keys'
import { applyAssign, applyDismiss, applySeverity, applyTriage } from './inbox/actions'
import { Preview } from './inbox/Preview'

const FIELDS: FilterField<InboxRow>[] = [
  { key: 'sev', label: 'Severity', values: [{ value: '1', label: 'SEV1' }, { value: '2', label: 'SEV2' }, { value: '3', label: 'SEV3' }], match: (r, v) => v.includes(String(r.sev)) },
  { key: 'kind', label: 'Kind', values: [{ value: 'tag', label: 'Tag' }, { value: 'incident', label: 'Incident' }], match: (r, v) => v.includes(r.kind) },
  { key: 'status', label: 'Status', values: [{ value: 'captured', label: 'Captured' }, { value: 'triaged', label: 'Triaged' }], match: (r, v) => v.includes(r.status.toLowerCase()) },
  { key: 'owner', label: 'Owner', values: [{ value: 'none', label: COPY.unassigned }, { value: 'me', label: 'Me' }],
    match: (r, v) => (v.includes('none') && !r.ownerId) || (v.includes('me') && r.ownerId === ME_ID) || v.includes((r.ownerId ?? '').toLowerCase()) },
  { key: 'shift', label: 'Shift', values: [{ value: 'am', label: 'AM' }, { value: 'pm', label: 'PM' }, { value: 'gy', label: COPY.shiftName.GY }], match: (r, v) => v.includes(r.shiftId.toLowerCase()) },
  { key: 'flag', label: 'Flag', values: [{ value: 'escalated', label: 'Escalated' }, { value: 'overdue', label: 'Overdue' }, { value: 'stale', label: 'Stale' }], match: (r, v) => r.flags.some((f) => v.includes(f.toLowerCase())) },
]

function Scope({ value, onChange, mine, team }: { value: 'mine' | 'team'; onChange: (v: 'mine' | 'team') => void; mine: number; team: number }) {
  const items = [{ id: 'mine' as const, label: 'My shift', n: mine }, { id: 'team' as const, label: 'Team', n: team }]
  return (
    <div role="radiogroup" aria-label="Queue scope: my shift or whole team" className="flex h-ctl shrink-0 items-center rounded-sm border border-line-strong p-px">
      {items.map((it) => (
        <button key={it.id} type="button" role="radio" aria-checked={value === it.id} onClick={() => onChange(it.id)}
          className={cx('inline-flex h-full items-center gap-2 rounded-xs px-pad text-base font-medium', value === it.id ? 'bg-accent-subtle text-accent-subtle-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg')}>
          {it.label}<span className="text-sm tabular-nums text-fg-muted">{fmtNum(it.n)}</span>
        </button>
      ))}
    </div>
  )
}

function OwnerAvatar({ id }: { id?: string }) {
  const p = getPerson(id)
  return (
    <Tip tip={p ? p.name : COPY.unassigned}>
      {p
        ? <span role="img" aria-label={p.name} className="inline-flex size-6 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-fg-muted">{p.initials}</span>
        : <span role="img" aria-label="Unassigned" className="inline-flex size-6 items-center justify-center rounded-full border border-dashed border-line-strong text-xs text-fg-subtle">—</span>}
    </Tip>
  )
}

export default function InboxScreen() {
  useStore()
  const nav = useNavigate()
  const { toast } = useApp()
  const [q, setQ] = useQueryState('q')
  const [view, setView] = useQueryState('view')
  const [sel, setSel] = useQueryState('sel')
  const [scopeP, setScope] = useQueryState('scope', 'mine')
  const scope: 'mine' | 'team' = scopeP === 'team' ? 'team' : 'mine'
  const paneRef = useRef<SplitPaneHandle>(null)

  const mineAll = getInbox('mine')
  const teamAll = getInbox('team')
  const scoped = scope === 'mine' ? mineAll : teamAll
  const rows = useMemo(() => filterRows(scoped, q, FIELDS, (r) => `${r.title} ${r.id} ${r.vehicleId} ${r.type}`),
    // scoped is a fresh array each store version; length+first key is enough to invalidate alongside q
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoped, q])

  const views = getSavedViews('inbox')
  useEffect(() => {
    if (rows.length && !rows.some((r) => r.key === sel)) setSel(rows[0].key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sel])
  const dwell = useDwell(sel, 120)
  const activeRow = rows.find((r) => r.key === dwell)
  useEffect(() => { document.title = `Inbox (${teamAll.length}) · Plumb` }, [teamAll.length])

  const onSeverity = (r: InboxRow, s: 1 | 2 | 3) => { toast({ message: `${r.id} set to SEV${s}`, undo: applySeverity([r], s) }) }
  const onAssign = (r: InboxRow, owner: string) => { toast({ message: `${r.id} assigned to ${personName(owner)}`, undo: applyAssign([r], owner) }) }
  const onTriage = (r: InboxRow) => { toast({ message: r.kind === 'tag' ? `${r.id} promoted to an incident` : `${r.id} marked triaged`, undo: applyTriage([r]) }) }
  const onDismiss = (r: InboxRow) => { toast({ message: `${r.id} dismissed`, undo: applyDismiss([r]) }) }

  const bulk = [
    { key: keyOf('assignMe'), label: 'Assign to me', run: (rs: InboxRow[]) => applyAssign(rs, ME_ID) },
    { key: keyOf('triage'), label: 'Mark triaged', run: (rs: InboxRow[]) => applyTriage(rs) },
    { key: '1', label: 'SEV1', run: (rs: InboxRow[]) => applySeverity(rs, 1) },
    { key: '2', label: 'SEV2', run: (rs: InboxRow[]) => applySeverity(rs, 2) },
    { key: '3', label: 'SEV3', run: (rs: InboxRow[]) => applySeverity(rs, 3) },
    { key: keyOf('dismiss'), label: 'Dismiss tags', run: (rs: InboxRow[]) => applyDismiss(rs) },
  ]

  const PROPOSED_TIP = 'SEV? = proposed from tag type, confirm with 1–3'
  const cols: Column<InboxRow>[] = [
    { key: 'sev', header: 'Sev', width: 32, cell: (r) => r.proposed ? <Tip tip={PROPOSED_TIP}><span><SeverityChip sev={r.sev} proposed /></span></Tip> : <SeverityChip sev={r.sev} />, sortValue: (r) => r.sev },
    { key: 'id', header: 'ID', width: 23, mono: true, cell: (r) => <span className="whitespace-nowrap">{r.id}</span>, sortValue: (r) => r.id },
    {
      key: 'title', header: 'Title', sortValue: (r) => r.title,
      cell: (r) => (
        <Tip className="flex w-0 min-w-full" tip={`${r.title} (${r.vehicleId})${r.flags.length ? ` · ${r.flags.join(', ')}` : ''}`}>
          <span className="flex w-full min-w-0 items-baseline gap-2 overflow-hidden">
            <span className="truncate" title={r.title}>{r.title}</span>
            {r.tagCount > 1 && <span className="shrink-0 text-sm text-fg-subtle tabular-nums">{fmtNum(r.tagCount)}</span>}
          </span>
        </Tip>
      ),
    },
    { key: 'status', header: 'Status', width: 31, cell: (r) => <StatusMarker status={r.status} variant="inline" />, sortValue: (r) => r.status },
    { key: 'owner', header: 'Owner', width: 14, cell: (r) => <OwnerAvatar id={r.ownerId} />, sortValue: (r) => personName(r.ownerId) },
    { key: 'age', header: 'Age', width: 14, align: 'right', cell: (r) => <span className="whitespace-nowrap" title={`Created ${r.createdAt}`}>{fmtAge(Math.max(0, ageMin(r.createdAt)))}</span>, sortValue: (r) => r.createdAt },
  ]

  const emptyAll = scoped.length === 0
  const empty = emptyAll ? (
    <EmptyState variant="success" title={scope === 'mine' ? 'Your inbox is clear' : 'The whole team queue is clear'}
      description={scope === 'mine'
        ? `Every tag on your shift is triaged and every new incident has a next step.${teamAll.length ? ` ${fmtNum(teamAll.length)} still waiting on other shifts.` : ''}`
        : 'Every tag is triaged and every new incident has a next step. Oversight debt is not growing here.'}
      action={{ label: 'Review footage queue', onClick: () => nav('/review') }}
      secondary={scope === 'mine' && teamAll.length ? { label: `See team queue (${fmtNum(teamAll.length)})`, onClick: () => setScope('team') } : { label: 'Go to Now', onClick: () => nav('/now') }} />
  ) : (
    <EmptyState variant="no-results" title="No matches" description={`Nothing in ${scope === 'mine' ? 'your' : 'the team'} queue matches "${q}".`}
      action={{ label: 'Clear filters', onClick: () => { setQ(''); setView('') } }} />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <h1 className="sr-only">Inbox</h1>
      <FilterBar fields={FIELDS} query={q} onQueryChange={(v) => { setQ(v); if (view) setView('') }} views={views} activeViewId={view || null}
        onViewChange={(id) => { setView(id ?? ''); setQ(views.find((v) => v.id === id)?.query ?? '') }}
        resultCount={rows.length} totalCount={scoped.length}
        quick={<Scope value={scope} onChange={setScope} mine={mineAll.length} team={teamAll.length} />}
        trailing={<span className="hidden items-center gap-1 text-sm text-fg-subtle xl:flex"><Kbd>j</Kbd><Kbd>k</Kbd> move <Kbd>x</Kbd> select <Kbd>{keyOf('assignMe')}</Kbd> assign to me <Kbd>1</Kbd>-<Kbd>3</Kbd> SEV <Kbd>{keyOf('triage')}</Kbd> triage <Kbd>{keyOf('dismiss')}</Kbd> dismiss</span>} />
      {rows.some((r) => r.proposed) && <p className="border-b border-line px-pad py-1 text-sm text-fg-subtle">SEV? = proposed from tag type, confirm with <Kbd>1</Kbd>–<Kbd>3</Kbd></p>}
      <SplitPane detailMax={110} listLabel="Inbox queue" detailLabel="Incident preview" apiRef={paneRef}
        list={
          <DataTable ariaLabel="Inbox queue" columns={cols} rows={rows} rowKey={(r) => r.key} rowSev={(r) => r.sev} selectable
            groupBy={(r) => ({ key: String(r.sev), label: `SEV${r.sev}` })}
            activeKey={sel || null} onActiveChange={(k) => setSel(k)}
            onOpen={(r, { full }) => { if (full && r.incidentId) nav(`/incidents/${r.incidentId}`); else paneRef.current?.focusDetail() }}
            bulkActions={bulk} empty={empty}
            footer={rows.length ? <span className="inline-flex items-center gap-2 text-sm text-fg-subtle">{fmtNum(rows.length)} in view <FlagPill flag="Escalated" /> {COPY.escalatedCount(rows.filter((r) => r.flags.includes('Escalated')).length)}</span> : undefined} />
        }
        detail={activeRow ? <Preview row={activeRow} onSeverity={onSeverity} onAssign={onAssign} onTriage={onTriage} onDismiss={onDismiss} /> : undefined}
        emptyDetail={<div className="flex flex-1 items-center justify-center p-pane text-base text-fg-subtle">Select a row to preview it. <Kbd className="ml-2">j</Kbd><Kbd className="ml-1">k</Kbd></div>} />
    </div>
  )
}
