import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Avatar, Button, ErrorState, EscalationCard, FlagPill, Icon, Pill, SeverityChip, StatusMarker, Timeline, sevEdgeClass,
} from '../components'
import { useApp } from '../lib/app'
import { COPY } from '../lib/copy'
import { cx } from '../lib/cx'
import {
  ME_ID, getEscalation, getIncident, getIncidents, getLeads, getMapMarkers, personName, type IncidentDetail,
} from '../lib/queries'
import { acknowledgeEscalation, addComment, advanceStatus, assignOwner, handOffEscalation, raiseEscalation, unassignOwner, useStore } from '../lib/store'
import { ageMin, fmtAge, fmtDateTime, fmtNum, fmtRel } from '../lib/time'
import { fmtCombo, keyOf, useHotkeys } from '../lib/keys'
import { buildEvents, CATEGORIES, type Category } from './incident/events'
import { ContextPanel } from './incident/ContextPanel'

const FROM_LABEL: Record<string, string> = {
  now: 'Now', inbox: 'Inbox', owned: 'Owned', review: 'Review', fleet: 'Fleet', plan: 'Plan', incidents: 'Incident', escalations: 'Escalation',
}
/** Where the user came from, as a safe in-app path (?from=). Label is derived from it. */
function useOrigin() {
  const [sp] = useSearchParams()
  const raw = sp.get('from') ?? ''
  const from = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/inbox'
  const seg = from.split(/[/?]/)[1] ?? 'inbox'
  const incMatch = from.match(/^\/incidents\/([^/?]+)/)
  const label = incMatch ? incMatch[1].toUpperCase() : seg === 'fleet' && /vehicle=([^&]+)/.test(from) ? from.match(/vehicle=([^&]+)/)![1] : FROM_LABEL[seg] ?? 'Back'
  return { from, label, explicit: raw !== '' }
}

export default function IncidentScreen() {
  const { id = '' } = useParams()
  useStore()
  const detail = getIncident(id)
  if (!detail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-pane">
        <ErrorState blocking title={`No incident "${id}"`} detail={`It may have been merged or the ID is mistyped. Press ${fmtCombo(['mod', 'k'])} and search by number.`} refId={`INC-LOOKUP:${id || 'empty'}`} />
      </div>
    )
  }
  return <Page key={detail.incident.id} d={detail} />
}

function Page({ d }: { d: IncidentDetail }) {
  const { incident: inc } = d
  const { toast } = useApp()
  const nav = useNavigate()
  const origin = useOrigin()
  const loc = useLocation()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [reassignOpen, setReassignOpen] = useState(false)
  const reassignRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const active = d.escalations.find((e) => e.state === 'Raised' || e.state === 'Timed out')
  const escView = active ? getEscalation(active.id) : undefined
  const idleMin = ageMin(inc.updatedAt)
  const stale = inc.flags.includes('Stale')
  const done = inc.status === 'Verified'
  const unowned = !inc.ownerId && !done
  const here = `${loc.pathname}`
  const leads = getLeads()

  const all = useMemo(() => buildEvents(d, []), [d])
  const events = useMemo(() => all.filter((e) => cat === 'all' || e.cat === cat).map((e) => e.event), [all, cat])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length }
    all.forEach((e) => { c[e.cat] = (c[e.cat] ?? 0) + 1 })
    return c
  }, [all])

  const markers = getMapMarkers({ incidentId: inc.id, layers: ['tag', 'hazard'] })

  // Verifying needs a second person; Owned needs an owner. Either blocks the advance verb.
  const advDisabled = !d.nextStatus ? 'Already Verified'
    : d.nextStatus === 'Verified' && !d.canVerify ? 'The person who resolved it cannot verify'
    : d.nextStatus === 'Owned' && !inc.ownerId ? 'Assign an owner first'
    : undefined

  const assignTo = (personId: string, name: string) => {
    const prev = { ownerId: inc.ownerId, status: inc.status }
    assignOwner(inc.id, personId)
    setReassignOpen(false)
    toast({ message: personId === ME_ID ? `${inc.id} is now yours` : `${inc.id} assigned to ${name}`, undo: () => unassignOwner(inc.id, prev) })
  }
  const advance = () => {
    if (advDisabled || !d.nextStatus) return false
    const ok = advanceStatus(inc.id)
    toast(ok ? { message: `${inc.id} moved to ${d.nextStatus}` } : { message: 'Another person must verify this incident' })
  }
  const escalate = () => {
    if (done) return false
    if (active) { nav(`/escalations/${active.id}`); return }
    const eid = raiseEscalation(inc.id)
    if (eid) { toast({ message: `${inc.id} escalated as ${eid}` }); nav(`/escalations/${eid}`) }
  }
  const submitComment = () => {
    const t = draft.trim(); if (!t) return
    addComment(inc.id, t); setDraft('')
    toast({ message: 'Comment added' })
  }

  // The primary is whatever the state calls for: take it if nobody owns it, otherwise the next lifecycle step.
  const primary: 'assignMe' | 'advance' | null = done ? null : unowned ? 'assignMe' : 'advance'
  useHotkeys({
    assignMe: () => { if (!unowned) return false; assignTo(ME_ID, 'you') },
    reassign: () => { if (done || unowned) return false; setReassignOpen((o) => !o) },
    escalate,
    advance,
    comment: () => { noteRef.current?.focus() },
  })

  useEffect(() => { if (!reassignOpen) return; const f = (e: MouseEvent) => { if (!reassignRef.current?.contains(e.target as Node)) setReassignOpen(false) }; document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f) }, [reassignOpen])

  const steps = useMemo(() => {
    const s: Partial<Record<(typeof inc)['status'], { by: string; at: string }>> = {}
    d.timeline.forEach((e) => { if (e.status && !s[e.status]) s[e.status] = { by: e.actor ?? 'System', at: fmtDateTime(e.at) } })
    return s
  }, [d.timeline])

  const related = getIncidents((i) => i.id !== inc.id && (i.vehicleIds.some((v) => inc.vehicleIds.includes(v)) || (!!inc.hazardId && i.hazardId === inc.hazardId)))
  const originTrail = origin.explicit ? origin.label : 'Inbox'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-sunken">
      <header className="relative shrink-0 border-b border-line bg-surface">
        <span aria-hidden className={cx('absolute inset-y-0 left-0', sevEdgeClass(inc.sev))} />
        <div className="flex flex-col gap-2 px-pane py-pad">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-fg-muted">
            <Link to={origin.from} className="inline-flex h-hit items-center gap-1 rounded-sm px-1 text-fg-link hover:bg-surface-hover"><Icon name="left" className="size-3" />{originTrail}</Link>
            <span aria-hidden className="text-fg-subtle">/</span>
            <span aria-current="page" className="font-mono text-fg">{inc.id}</span>
          </nav>

          <div className="flex items-start gap-gap">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip sev={inc.sev} proposed={inc.sevProposed} />
                {inc.flags.map((f) => <FlagPill key={f} flag={f} age={f === 'Stale' ? fmtAge(idleMin) : undefined} />)}
                <Pill>{inc.type}</Pill>
                <Pill>{inc.shiftName} shift</Pill>
              </div>
              <h1 className="max-w-(--spacing-content) text-lg font-semibold text-fg [text-wrap:balance]">{inc.title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!done && !unowned && (
                <div ref={reassignRef} className="relative">
                  <Button aria-haspopup="menu" aria-expanded={reassignOpen} hint={keyOf('reassign')} onClick={() => setReassignOpen((o) => !o)}>Reassign</Button>
                  {reassignOpen && (
                    <div role="menu" aria-label="Reassign owner" onKeyDown={(e) => { if (e.key === 'Escape') { setReassignOpen(false); (reassignRef.current?.querySelector('button') as HTMLElement)?.focus() } }}
                      className="absolute top-full right-0 z-30 mt-1 flex w-64 flex-col rounded-md border border-line bg-surface-raised p-1 shadow-2">
                      {leads.map((l, i) => (
                        <button key={l.id} role="menuitem" autoFocus={i === 0} type="button" onClick={() => assignTo(l.id, l.name)}
                          className="flex h-row items-center gap-2 rounded-sm px-2 text-left text-base text-fg hover:bg-surface-hover focus-visible:bg-surface-hover">
                          <Avatar initials={l.initials} />
                          <span className="min-w-0 flex-1 truncate">{l.name}</span>
                          <span className="text-sm text-fg-subtle">{l.shiftId}{l.id === inc.ownerId ? ' · current' : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!done && (
                <Button hint={keyOf('escalate')} onClick={() => { escalate() }} icon={<Icon name="arrow-up-bar" />}>{active ? 'View escalation' : 'Escalate'}</Button>
              )}
              {primary === 'assignMe' && <Button variant="primary" hint={keyOf('assignMe')} onClick={() => assignTo(ME_ID, 'you')}>Assign to me</Button>}
              {primary === 'advance' && (
                <Button variant="primary" hint={keyOf('advance')} onClick={() => { advance() }} disabled={!!advDisabled} disabledReason={advDisabled}>Move to {d.nextStatus}</Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <StatusMarker variant="block" status={inc.status} flags={[]} steps={steps} />
            <dl className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <dt className="text-fg-subtle">{COPY.incident.ownerLabel}</dt>
                <dd className="flex items-center gap-2">
                  {inc.ownerId ? <><Avatar initials={d.owner?.initials ?? '?'} /><span className="font-medium text-fg">{inc.ownerName}</span></> : <span className="font-medium text-fg">{COPY.unassigned}</span>}
                </dd>
              </div>
              <div className="flex items-center gap-2"><dt className="text-fg-subtle">Reported by</dt><dd className="text-fg">{d.reporter?.name ?? 'Unknown'}</dd></div>
              <div className="flex items-center gap-2"><dt className="text-fg-subtle">Opened</dt><dd className="text-fg">{fmtRel(inc.createdAt)}</dd></div>
              <div className="flex items-center gap-2"><dt className="text-fg-subtle">Last update</dt><dd className={cx('text-fg', stale && 'font-medium')}>{fmtRel(inc.updatedAt)}</dd></div>
              {inc.dueAt && <div className="flex items-center gap-2"><dt className="text-fg-subtle">Due</dt><dd className="text-fg">{fmtDateTime(inc.dueAt)}</dd></div>}
            </dl>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section aria-label="Activity" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-pane">
          <div className="mx-auto flex w-full max-w-(--spacing-content) flex-col gap-gap">
            {escView && (
              <section aria-label="Active escalation" className="flex flex-col gap-2">
                <EscalationCard view={escView} variant={escView.isMine ? 'full' : 'readonly'} hideTitle hideMeta
                  onAcknowledge={() => { acknowledgeEscalation(escView.escalation.id); toast({ message: `${escView.escalation.id} acknowledged` }) }}
                  onHandOff={(to) => { handOffEscalation(escView.escalation.id, to); toast({ message: `${escView.escalation.id} handed off to ${personName(to)}` }) }}
                  incidentHref={here} />
              </section>
            )}

            <section aria-label="Timeline" className="rounded-md border border-line bg-surface">
              <div className="flex flex-wrap items-center gap-2 border-b border-line px-pane py-2">
                <h2 className="mr-2 text-md font-medium text-fg">Timeline</h2>
                <div role="group" aria-label="Filter timeline" className="flex flex-wrap items-center gap-1">
                  {(['all', ...Object.keys(CATEGORIES)] as (Category | 'all')[]).map((c) => (
                    <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
                      className={cx('inline-flex h-chip items-center gap-1 rounded-sm border px-2 text-sm', cat === c ? 'border-accent bg-accent-subtle text-accent-subtle-fg' : 'border-line text-fg-muted hover:bg-surface-hover')}>
                      {c === 'all' ? 'All' : CATEGORIES[c]}<span className="text-fg-subtle">{fmtNum(counts[c] ?? 0)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-pane">
                <Timeline ariaLabel={`Timeline for ${inc.id}`} events={events} selectedId={selected} onSelect={(e) => setSelected(e.id)} showNow
                  emptyLabel={`No ${cat === 'all' ? '' : CATEGORIES[cat].toLowerCase() + ' '}events yet`}
                  renderExpanded={(e) => { const x = all.find((a) => a.event.id === e.id); return x?.expanded ?? null }} />
              </div>
              <form className="flex flex-col gap-2 border-t border-line p-pane" onSubmit={(e) => { e.preventDefault(); submitComment() }}>
                <label htmlFor="note" className="text-sm font-medium text-fg-muted">Add a comment</label>
                <textarea id="note" ref={noteRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="What did you see or decide?"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.currentTarget.form?.requestSubmit() } if (e.key === 'Escape') e.currentTarget.blur() }}
                  className="w-full resize-y rounded-sm border border-line-strong bg-surface px-pad py-2 text-base text-fg placeholder:text-fg-subtle" />
                <div className="flex items-center justify-end gap-2"><Button type="submit" disabled={!draft.trim()} disabledReason="Write something first" hint={fmtCombo(['mod', 'Enter'])}>Comment</Button></div>
              </form>
            </section>
          </div>
        </section>

        <ContextPanel d={d} markers={markers} selected={selected} onSelect={setSelected} related={related} here={here} />
      </div>
    </div>
  )
}
