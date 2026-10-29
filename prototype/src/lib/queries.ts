/**
 * Read helpers over the fixtures. Pure functions; call them in render. Components that must update after a mutation call useStore() (lib/store.ts).
 * Sort convention everywhere: SEV ascending (SEV1 first), then newest first, then id (so ties are stable).
 */
import {
  CAMPAIGNS, COVERAGE, DEBT_HISTORY, DEBT_LAST_SHIFT, DRIVES, ESCALATIONS, FOOTAGE, HAZARDS, INCIDENTS, LEADS, ME_ID, OPERATORS, ROUTES,
  SAVED_VIEWS, SHIFTS, SPAN_BASELINE, TAGS, VEHICLES,
} from '../data/fixtures'
import {
  LIFECYCLE, type Campaign, type CoverageSegment, type DebtSnapshot, type Drive, type Escalation, type FootageReview, type Hazard, type Incident,
  type IssueTag, type Lead, type MapMarker, type Operator, type QueueId, type SavedView, type Shift, type ShiftId, type Sev, type Status,
  type TimelineEvent, type Vehicle, type Flag,
} from '../data/types'
import { FIXTURE_NOW_MS, ms, shiftOf } from './time'

export { ME_ID, SPAN_BASELINE }
const lvl = (s: Status) => LIFECYCLE.indexOf(s)
const bySevRecent = <T extends { sev: Sev }>(a: T & { createdAt?: string; at?: string; id: string }, b: T & { createdAt?: string; at?: string; id: string }) =>
  a.sev - b.sev || (b.createdAt ?? b.at ?? '').localeCompare(a.createdAt ?? a.at ?? '') || a.id.localeCompare(b.id)

/* ---------- people & lookups ---------- */
export interface Person { id: string; name: string; initials: string; kind: 'lead' | 'operator' | 'system'; shiftId?: ShiftId; reachable?: Lead['reachable'] }
export const getPerson = (id?: string): Person | undefined => {
  if (!id) return undefined
  if (id === 'SYS') return { id, name: 'System', initials: 'SY', kind: 'system' }
  const l = LEADS.find((x) => x.id === id)
  if (l) return { id, name: l.name, initials: l.initials, kind: 'lead', shiftId: l.shiftId, reachable: l.reachable }
  const o = OPERATORS.find((x) => x.id === id)
  return o ? { id, name: o.name, initials: o.initials, kind: 'operator', shiftId: o.shiftId } : undefined
}
export const personName = (id?: string): string => getPerson(id)?.name ?? 'Unassigned'
export const getCurrentUser = (): Lead => LEADS.find((l) => l.id === ME_ID)!
export const getLeads = (): Lead[] => LEADS
export const getLead = (id: string) => LEADS.find((l) => l.id === id)
export const getOperators = (shiftId?: ShiftId): Operator[] => (shiftId ? OPERATORS.filter((o) => o.shiftId === shiftId) : OPERATORS)
export const getOperator = (id: string) => OPERATORS.find((o) => o.id === id)
export const getShifts = (): Shift[] => SHIFTS
export const getShift = (id: ShiftId) => SHIFTS.find((s) => s.id === id)!
export const getCurrentShiftId = (): ShiftId => shiftOf(FIXTURE_NOW_MS)
/** Rota: leads in call order. */
export const getRota = (): Lead[] => [...LEADS].sort((a, b) => a.rotaOrder - b.rotaOrder)
export const getVehicle = (id: string) => VEHICLES.find((v) => v.id === id)
export const getDrive = (id: string) => DRIVES.find((d) => d.id === id)
export const getHazards = (): Hazard[] => HAZARDS
export const getHazard = (id: string) => HAZARDS.find((h) => h.id === id)
export const getRoutes = () => ROUTES
export const getSavedViews = (q: QueueId): SavedView[] => SAVED_VIEWS[q]

/* ---------- incidents ---------- */
export interface IncidentRow extends Incident { ownerName: string; shiftName: string; vehicleLabel: string; tagCount: number }
const toRow = (i: Incident): IncidentRow => ({
  ...i, ownerName: personName(i.ownerId), shiftName: getShift(i.shiftId).name, vehicleLabel: i.vehicleIds.join(', '), tagCount: i.tagIds.length,
})
export const getIncidents = (filter?: (i: Incident) => boolean): IncidentRow[] =>
  INCIDENTS.filter(filter ?? (() => true)).map(toRow).sort(bySevRecent)

export interface IncidentDetail {
  incident: IncidentRow
  owner?: Person; reporter?: Person; resolver?: Person; verifier?: Person
  vehicles: Vehicle[]; drives: Drive[]; tags: IssueTag[]; hazard?: Hazard
  escalations: Escalation[]; footage?: FootageReview
  timeline: TimelineEvent[]
  /** Next legal lifecycle step, or undefined at Verified. */
  nextStatus?: Status
  /** True when the signed-in user may verify (Resolved and not the resolver). */
  canVerify: boolean
}
export const getIncident = (id: string): IncidentDetail | undefined => {
  const i = INCIDENTS.find((x) => x.id.toLowerCase() === id.toLowerCase())
  if (!i) return undefined
  return {
    incident: toRow(i), owner: getPerson(i.ownerId), reporter: getPerson(i.reporterId), resolver: getPerson(i.resolvedBy), verifier: getPerson(i.verifiedBy),
    vehicles: i.vehicleIds.map((v) => getVehicle(v)!), drives: i.driveIds.map((d) => getDrive(d)!), tags: i.tagIds.map((t) => TAGS.find((x) => x.id === t)!),
    hazard: i.hazardId ? getHazard(i.hazardId) : undefined, escalations: ESCALATIONS.filter((e) => e.incidentId === i.id),
    footage: FOOTAGE.find((f) => f.incidentId === i.id), timeline: getTimeline(i.id),
    nextStatus: lvl(i.status) < 4 ? LIFECYCLE[lvl(i.status) + 1] : undefined, canVerify: i.status === 'Resolved' && i.resolvedBy !== ME_ID,
  }
}
/** Audit trail as timeline events, newest first. */
export const getTimeline = (incidentId: string): TimelineEvent[] => {
  const i = INCIDENTS.find((x) => x.id === incidentId)
  if (!i) return []
  const kindMap: Record<string, TimelineEvent['kind']> = { tag: 'tag', opened: 'incident', triaged: 'status', severity: 'severity', assigned: 'assign', escalated: 'escalation', ack: 'escalation', rerouted: 'escalation', note: 'note', resolved: 'status', verified: 'status' }
  return i.history
    .map((h): TimelineEvent => ({
      id: h.id, at: h.at, kind: kindMap[h.kind], actor: personName(h.actorId), verb: h.text, sev: h.kind === 'tag' || h.kind === 'severity' ? h.sev : undefined,
      status: h.kind === 'triaged' || h.kind === 'resolved' || h.kind === 'verified' || h.kind === 'assigned' ? h.status : undefined, mapId: h.tagId,
    }))
    .sort((a, b) => b.at.localeCompare(a.at))
}

export interface InboxRow {
  key: string
  kind: 'tag' | 'incident'
  id: string // TG-... or INC-...
  incidentId?: string
  sev: Sev
  proposed: boolean // severity is auto-proposed, not confirmed
  title: string
  type: string
  status: Status
  flags: Flag[]
  ownerId?: string
  shiftId: ShiftId
  vehicleId: string
  at: string
  createdAt: string
  tagCount: number
}
/** Lead's triage queue: untriaged tags plus incidents still Captured/Triaged. 'mine' = assigned to me, or raised on my shift and still Captured; 'team' = whole program. */
export const getInbox = (scope: 'mine' | 'team' = 'team', shiftId?: ShiftId): InboxRow[] => {
  const sid = shiftId ?? (scope === 'mine' ? getCurrentUser().shiftId : undefined)
  const tags: InboxRow[] = TAGS.filter((t) => t.state === 'Captured' && !t.incidentId).map((t) => ({
    key: t.id, kind: 'tag', id: t.id, sev: t.proposedSev, proposed: true, title: `${t.type} at ${t.locationLabel}`, type: t.type, status: 'Captured', flags: [],
    shiftId: t.shiftId, vehicleId: t.vehicleId, at: t.at, createdAt: t.at, tagCount: 1,
  }))
  const incs: InboxRow[] = INCIDENTS.filter((i) => lvl(i.status) <= 1).map((i) => ({
    key: i.id, kind: 'incident', id: i.id, incidentId: i.id, sev: i.sev, proposed: i.sevProposed, title: i.title, type: i.type, status: i.status, flags: i.flags, ownerId: i.ownerId,
    shiftId: i.shiftId, vehicleId: i.vehicleIds[0], at: i.updatedAt, createdAt: i.createdAt, tagCount: i.tagIds.length,
  }))
  // 'mine' = assigned to me, or raised on my shift and not yet triaged (Captured).
  const keep = (r: InboxRow) => scope === 'mine' && !shiftId ? r.ownerId === ME_ID || (r.shiftId === sid && r.status === 'Captured') : !sid || r.shiftId === sid
  return [...tags, ...incs].filter(keep).sort(bySevRecent)
}
/** Incidents the person owns that are not yet Verified (Resolved items wait for someone else to verify). */
export const getOwned = (personId: string = ME_ID): IncidentRow[] =>
  getIncidents((i) => i.ownerId === personId && i.status !== 'Verified')
export const getIssueTags = (): IssueTag[] => TAGS

/* ---------- escalations ---------- */
export interface EscalationView {
  escalation: Escalation
  incident: IncidentRow
  chain: { link: Escalation['chain'][number]; person: Person }[]
  current: Person
  /** The next person on the rota after the current owner (undefined if none left). */
  backup?: Person
  raisedBy: Person
  /** The signed-in user is the person who must act now. */
  isMine: boolean
  /** Awaiting acknowledgement. */
  active: boolean
  rerouted: boolean
}
export const getEscalation = (id: string): EscalationView | undefined => {
  const e = ESCALATIONS.find((x) => x.id.toLowerCase() === id.toLowerCase())
  if (!e) return undefined
  const chain = e.chain.map((link) => ({ link, person: getPerson(link.personId)! }))
  const incident = toRow(INCIDENTS.find((i) => i.id === e.incidentId)!)
  const next = e.chain.find((_c, idx) => idx > e.currentIndex)
  return {
    escalation: e, incident, chain, current: chain[e.currentIndex].person, backup: next ? getPerson(next.personId) : undefined,
    raisedBy: chain[0].person, isMine: chain[e.currentIndex].person.id === ME_ID && (e.state === 'Raised' || e.state === 'Timed out'),
    active: e.state === 'Raised' || e.state === 'Timed out', rerouted: e.state === 'Timed out',
  }
}
export const getActiveEscalations = (shiftId?: ShiftId): EscalationView[] =>
  ESCALATIONS.filter((e) => e.state === 'Raised' || e.state === 'Timed out')
    .map((e) => getEscalation(e.id)!)
    .filter((v) => !shiftId || v.incident.shiftId === shiftId)
    .sort((a, b) => ms(a.escalation.raisedAt) - ms(b.escalation.raisedAt))
export const getEscalations = (): EscalationView[] => ESCALATIONS.map((e) => getEscalation(e.id)!)

/* ---------- footage review ---------- */
export interface ReviewRow extends FootageReview { incidentTitle: string; reviewerName: string; incidentStatus: Status }
export const getReviewQueue = (filter?: (r: FootageReview) => boolean): ReviewRow[] =>
  FOOTAGE.filter(filter ?? (() => true))
    .map((f) => ({ ...f, incidentTitle: INCIDENTS.find((i) => i.id === f.incidentId)!.title, incidentStatus: INCIDENTS.find((i) => i.id === f.incidentId)!.status, reviewerName: personName(f.reviewerId) }))
    .sort((a, b) => (a.flags.includes('Overdue') ? 0 : 1) - (b.flags.includes('Overdue') ? 0 : 1) || a.sev - b.sev || ms(a.due) - ms(b.due))
export const getReview = (id: string) => getReviewQueue().find((r) => r.id === id)

/* ---------- fleet ---------- */
export interface VehicleRow extends Vehicle { operator?: Person; openIncidents: number; lastIncidentAt?: string }
export const getFleet = (): VehicleRow[] =>
  VEHICLES.map((v) => {
    const open = INCIDENTS.filter((i) => i.vehicleIds.includes(v.id) && lvl(i.status) < 3)
    const drive = v.currentDriveId ? getDrive(v.currentDriveId) : undefined
    return { ...v, operator: getPerson(drive?.operatorId), openIncidents: open.length, lastIncidentAt: INCIDENTS.filter((i) => i.vehicleIds.includes(v.id)).map((i) => i.createdAt).sort().pop() }
  })
export const getVehicleDetail = (id: string) => {
  const v = getVehicle(id)
  if (!v) return undefined
  return { vehicle: v, drives: DRIVES.filter((d) => d.vehicleId === id), incidents: getIncidents((i) => i.vehicleIds.includes(id)), repairs: v.repairs }
}
export const getDataHealth = () => {
  const all = VEHICLES.map((v) => v.health)
  return { vehicles: all, healthy: all.filter((h) => h.state === 'Healthy').length, degraded: all.filter((h) => h.state === 'Degraded').length, failing: all.filter((h) => h.state === 'Failing').length }
}
export const getCampaigns = (): Campaign[] => CAMPAIGNS
export const getMapMarkers = (opts: { incidentId?: string; layers?: ('tag' | 'incident' | 'hazard' | 'vehicle')[] } = {}): MapMarker[] => {
  const layers = opts.layers ?? ['tag', 'hazard', 'vehicle']
  const out: MapMarker[] = []
  if (layers.includes('hazard')) HAZARDS.forEach((h) => out.push({ id: h.id, kind: 'hazard', x: h.x, y: h.y, label: `${h.label} (${h.state})`, hazardState: h.state }))
  if (layers.includes('tag')) {
    const set = opts.incidentId ? INCIDENTS.find((i) => i.id === opts.incidentId)?.tagIds : undefined
    TAGS.filter((t) => t.state !== 'Dismissed' && (!set || set.includes(t.id))).forEach((t) => {
      const i = t.incidentId ? INCIDENTS.find((x) => x.id === t.incidentId) : undefined
      out.push({ id: t.id, kind: 'tag', x: t.x, y: t.y, label: `${t.id} ${t.type}`, sev: i?.sev ?? t.proposedSev, proposed: !i || i.sevProposed })
    })
  }
  if (layers.includes('vehicle')) VEHICLES.filter((v) => v.currentDriveId).forEach((v, k) => {
    const d = getDrive(v.currentDriveId!)!, r = ROUTES.find((x) => x.id === d.routeId)!, f = 0.15 + ((k * 0.11) % 0.7)
    const p = r.points, seg = f * (p.length - 1), j = Math.min(p.length - 2, Math.floor(seg)), t = seg - j
    out.push({ id: v.id, kind: 'vehicle', x: p[j][0] + (p[j + 1][0] - p[j][0]) * t, y: p[j][1] + (p[j + 1][1] - p[j][1]) * t, label: v.id, heading: (Math.atan2(p[j + 1][1] - p[j][1], p[j + 1][0] - p[j][0]) * 180) / Math.PI })
  })
  return out
}

/* ---------- Now: coverage, debt, load ---------- */
export const getCoverage = (shiftId?: ShiftId): CoverageSegment[] => COVERAGE.filter((c) => !shiftId || c.shiftId === shiftId)
export const getGaps = (shiftId?: ShiftId) => getCoverage(shiftId).filter((c) => c.kind === 'uncovered')

export interface Debt extends DebtSnapshot { }
export const getOversightDebt = (shiftId?: ShiftId): { current: Debt; previous?: Debt; history: number[] } => {
  const inShift = (id: string) => !shiftId || INCIDENTS.find((i) => i.id === id)?.shiftId === shiftId
  const mk = (a: Omit<DebtSnapshot, 'total'>): Debt => ({ ...a, total: a.unreviewedFootage + a.openIncidents + a.staleEscalations + a.uncoveredGaps })
  const current = mk({
    unreviewedFootage: FOOTAGE.filter((f) => lvl(f.status) < 3 && inShift(f.incidentId)).length,
    openIncidents: INCIDENTS.filter((i) => lvl(i.status) < 3 && (!shiftId || i.shiftId === shiftId)).length,
    staleEscalations: ESCALATIONS.filter((e) => e.state === 'Timed out' && inShift(e.incidentId)).length,
    uncoveredGaps: getGaps(shiftId).filter((g) => g.role === 'primary').length,
  })
  return { current, previous: shiftId ? undefined : mk(DEBT_LAST_SHIFT), history: DEBT_HISTORY }
}
export interface LeadSpan { lead: Lead; span: number; overBaseline: boolean }
export const getNow = (shiftId: ShiftId = getCurrentShiftId()) => {
  const shift = getShift(shiftId)
  const operators = getOperators(shiftId)
  const leads = shift.leadIds.map((id) => getLead(id)!)
  const gaps = getGaps(shiftId)
  const spans: LeadSpan[] = leads.map((lead, k) => ({ lead, span: k === 0 && !gaps.some((g) => g.role === 'primary') ? operators.length : 0, overBaseline: k === 0 && operators.length > SPAN_BASELINE }))
  return {
    shift, leads, operators, spans, coverage: getCoverage(shiftId), gaps, escalations: getActiveEscalations(), shiftEscalations: getActiveEscalations(shiftId),
    debt: getOversightDebt(shiftId), programDebt: getOversightDebt(),
    /** Open (not yet Resolved) incidents per operator in this shift, for the per-operator load view. */
    load: operators.map((o) => ({ operator: o, open: INCIDENTS.filter((i) => i.reporterId === o.id && lvl(i.status) < 3).length })),
  }
}

export const getNavCounts = () => ({
  now: getActiveEscalations().length + getGaps().filter((g) => g.role === 'primary').length,
  inbox: getInbox('team').length,
  owned: getOwned().length,
  review: getReviewQueue((f) => lvl(f.status) < 3).length,
  fleet: VEHICLES.filter((v) => v.status === 'Down' || v.health.state !== 'Healthy').length,
  plan: getGaps().length,
})

/* ---------- palette search ---------- */
export type SearchKind = 'incident' | 'vehicle' | 'drive' | 'operator'
export interface SearchHit { kind: SearchKind; id: string; title: string; meta: string; to: string; sev?: Sev }
export const getSearchIndex = (): SearchHit[] => [
  ...INCIDENTS.map((i): SearchHit => ({ kind: 'incident', id: i.id, title: i.title, meta: `${i.status} · ${i.type}`, to: `/incidents/${i.id}`, sev: i.sev })),
  ...VEHICLES.map((v): SearchHit => ({ kind: 'vehicle', id: v.id, title: `${v.id}${v.nickname ? ` "${v.nickname}"` : ''}`, meta: `${v.status} · build ${v.build}`, to: `/fleet?vehicle=${v.id}` })),
  ...DRIVES.map((d): SearchHit => ({ kind: 'drive', id: d.id, title: d.id, meta: `${d.vehicleId} · ${d.state}`, to: `/fleet?drive=${d.id}` })),
  ...[...OPERATORS, ...LEADS].map((p): SearchHit => ({ kind: 'operator', id: p.id, title: p.name, meta: `${p.id} · ${p.shiftId} shift`, to: `/fleet?operator=${p.id}` })),
]
