import type { ReactNode } from 'react'
import { createElement } from 'react'
import type { TimelineEvent } from '../../data/types'
import type { IncidentDetail } from '../../lib/queries'
import { personName } from '../../lib/queries'
import { fmtNum } from '../../lib/time'

export const CATEGORIES = { tags: 'Tags', telemetry: 'Telemetry', footage: 'Footage', comments: 'Comments', escalation: 'Escalation', workflow: 'Workflow' } as const
export type Category = keyof typeof CATEGORIES
export interface Merged { event: TimelineEvent; cat: Category; expanded?: ReactNode }

const row = (k: string, v: string) => createElement('div', { key: k, className: 'flex gap-2 text-sm' }, createElement('dt', { className: 'w-24 shrink-0 text-fg-subtle' }, k), createElement('dd', { className: 'min-w-0 text-fg' }, v))
const list = (rows: ReactNode[]) => createElement('dl', { className: 'mt-2 flex flex-col gap-1 rounded-sm bg-surface-sunken p-2' }, rows)

/** One merged feed: issue tags, telemetry markers, footage review, comments, escalation events, workflow changes. */
export function buildEvents(d: IncidentDetail, comments: { id: string; at: string; text: string }[]): Merged[] {
  const out: Merged[] = []
  const known = new Set<string>()
  d.timeline.forEach((e) => {
    known.add(e.id)
    out.push({ event: e, cat: e.kind === 'tag' ? 'tags' : e.kind === 'escalation' ? 'escalation' : e.kind === 'note' ? 'comments' : 'workflow' })
  })
  d.escalations.forEach((esc) => {
    esc.history.forEach((h) => {
      if (known.has(h.id)) return
      out.push({ cat: 'escalation', event: { id: h.id, at: h.at, kind: 'escalation', actor: personName(h.actorId), verb: h.text, object: esc.id } })
    })
    if (esc.ackAt) out.push({ cat: 'escalation', event: { id: `${esc.id}-ack`, at: esc.ackAt, kind: 'escalation', actor: personName(esc.ackBy), verb: 'acknowledged', object: esc.id } })
  })
  // Telemetry markers: ODD per drive and the latest data-health reading per vehicle.
  d.drives.forEach((dr) => {
    out.push({
      cat: 'telemetry',
      event: { id: `TM-${dr.id}`, at: dr.start, kind: 'note', actor: 'Telemetry', verb: 'drive started', object: dr.id, detail: dr.odd.join(', ') },
      expanded: list([row('Route', dr.routeId), row('State', dr.state), row('ODD', dr.odd.join(', ') || 'None recorded')]),
    })
  })
  d.vehicles.forEach((v) => {
    const h = v.health
    out.push({
      cat: 'telemetry',
      event: { id: `TH-${v.id}`, at: h.asOf, kind: 'note', actor: 'Telemetry', verb: `${v.id} data health ${h.state.toLowerCase()}`, detail: `${fmtNum(h.writeRate)} of ${fmtNum(h.writeRateNominal)} events/s`, sev: h.sev },
      expanded: list([row('Write rate', `${fmtNum(h.writeRate)} / ${fmtNum(h.writeRateNominal)} events per s`), row('Storage', `${h.storagePct}% used`), row('Sync skew', `${fmtNum(h.syncSkewMs)} ms`), row('Events today', fmtNum(v.eventsToday)), ...(h.note ? [row('Note', h.note)] : [])]),
    })
  })
  if (d.footage) {
    const f = d.footage
    out.push({
      cat: 'footage',
      event: { id: `FR-${f.id}`, at: f.due, kind: 'status', actor: f.reviewerId ? personName(f.reviewerId) : 'Unassigned', verb: `footage review ${f.status.toLowerCase()}${f.flags.includes('Overdue') ? ' (overdue)' : ''}`, object: f.id, detail: `Segment ${f.segment}`, status: f.status },
      expanded: list([row('Segment', f.segment), row('Reviewer', f.reviewerId ? personName(f.reviewerId) : 'Nobody yet'), row('Findings', f.findings.length ? f.findings.join('; ') : 'None recorded')]),
    })
  }
  d.incident.notes.forEach((n, i) => out.push({ cat: 'comments', event: { id: `NT-${i}`, at: d.incident.createdAt, kind: 'note', actor: d.reporter?.name, verb: 'noted', detail: n } }))
  comments.forEach((c) => out.push({ cat: 'comments', event: { id: c.id, at: c.at, kind: 'note', actor: 'You', verb: 'commented', detail: c.text } }))
  return out.sort((a, b) => b.event.at.localeCompare(a.event.at))
}
