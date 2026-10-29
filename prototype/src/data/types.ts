/** Domain types for the Fleet Console. Mirrors pipeline/object-model.md. All data is invented fixture data. */

export type Iso = string // ISO-8601 UTC timestamp, e.g. "2026-10-29T15:42:00.000Z"

/** One severity scale for tags, incidents, damage, data health, footage findings. */
export type Sev = 1 | 2 | 3

/** One lifecycle for Incident, Damage/repair, Footage review. */
export const LIFECYCLE = ['Captured', 'Triaged', 'Owned', 'Resolved', 'Verified'] as const
export type Status = (typeof LIFECYCLE)[number]
/** Exceptions are flags, never states. */
export type Flag = 'Escalated' | 'Overdue' | 'Stale'

export type ShiftId = 'AM' | 'PM' | 'GY'

export interface Program {
  id: string
  name: string
  site: string
}

export interface Shift {
  id: ShiftId
  name: string // "AM", "PM", "Night"
  startHour: number // UTC hour 0-23 (window start)
  endHour: number // window end (may be < start for overnight)
  leadIds: string[] // [primary, backup]
  state: 'Planned' | 'Active' | 'Closed' | 'Uncovered'
}

export interface Lead {
  id: string // LD-03
  name: string
  initials: string
  shiftId: ShiftId
  role: 'Primary' | 'Backup'
  onCall: boolean
  reachable: 'reachable' | 'unreachable' | 'unknown'
  lastSeen: Iso
  rotaOrder: number // position in the program-wide on-call rota (1 = first called)
}

export interface Operator {
  id: string // OP-117
  name: string
  initials: string
  shiftId: ShiftId
  status: 'On shift' | 'Off shift'
  certs: string[]
  currentDriveId?: string
}

export type VehicleStatus = 'Available' | 'In drive' | 'Down' | 'Retired'
export type HealthState = 'Healthy' | 'Degraded' | 'Failing'

export interface DataHealth {
  vehicleId: string
  writeRate: number // events / s (0 when vehicle is down)
  writeRateNominal: number
  storagePct: number // 0-100
  syncSkewMs: number // sensor sync skew
  state: HealthState // derived
  sev?: Sev // derived chip: Healthy none, Degraded SEV3, Failing SEV2 (SEV1 when active drive + safety-relevant)
  note?: string
  asOf: Iso
}

export interface Vehicle {
  id: string // FV-0104
  nickname?: string
  build: string
  condition: string // operator-written condition note
  status: VehicleStatus
  currentDriveId?: string
  health: DataHealth
  eventsToday: number // can be 0 or 10,000+
  repairs: Repair[]
}

export interface Repair {
  id: string
  vehicleId: string
  part: string
  sev: Sev
  status: Status
  technician?: string
  incidentId?: string
  reportedAt: Iso
}

export type OddCondition = 'Day' | 'Night' | 'Rain' | 'Dense traffic'

export interface Drive {
  id: string // DR-9040
  vehicleId: string
  operatorId: string
  routeId: string
  campaignId: string
  start: Iso
  end?: Iso
  state: 'Planned' | 'Active' | 'Ended' | 'Reviewed'
  odd: OddCondition[]
}

export type TagType =
  | 'Phantom brake'
  | 'Planner freeze'
  | 'Sensor drop'
  | 'Lane drift'
  | 'Late yield'
  | 'HMI glitch'
  | 'Other'

export interface IssueTag {
  id: string // TG-20931
  type: TagType
  at: Iso
  driveId: string
  vehicleId: string
  operatorId: string
  shiftId: ShiftId
  locationLabel: string
  x: number // 0-100 position on the schematic map
  y: number
  proposedSev: Sev
  state: 'Captured' | 'Triaged' | 'Dismissed'
  incidentId?: string
}

export interface AuditEvent {
  id: string
  at: Iso
  actorId: string // operator or lead id, or "SYS"
  kind: 'tag' | 'opened' | 'triaged' | 'severity' | 'assigned' | 'escalated' | 'ack' | 'rerouted' | 'note' | 'resolved' | 'verified' | 'unassigned' | 'comment' | 'handled' | 'protocol'
  text: string
  sev?: Sev
  status?: Status
  tagId?: string
}

export interface Incident {
  id: string // INC-4139
  title: string
  type: string
  sev: Sev
  sevProposed: boolean // true until the lead confirms
  status: Status
  flags: Flag[]
  vehicleIds: string[]
  driveIds: string[]
  tagIds: string[]
  reporterId: string
  ownerId?: string
  resolvedBy?: string
  verifiedBy?: string
  shiftId: ShiftId
  hazardId?: string
  createdAt: Iso
  updatedAt: Iso
  dueAt?: Iso
  notes: string[]
  history: AuditEvent[]
  escalationIds: string[]
}

export type ChainRole = 'Raised by' | 'Current owner' | 'Backup (rota)'
export interface ChainLink {
  role: ChainRole
  personId: string
  personKind: 'operator' | 'lead'
  reachable: 'reachable' | 'unreachable' | 'unknown'
  link: 'done' | 'timed-out' | 'current' | 'next'
  at?: Iso
}

export interface Escalation {
  id: string // ESC-0207
  incidentId: string
  raisedAt: Iso
  state: 'Raised' | 'Acknowledged' | 'Handled' | 'Timed out'
  chain: ChainLink[]
  currentIndex: number // index in chain of the person who must act now
  timeoutSec: number // per-link timeout
  deadline?: Iso // when the current link times out and re-routes (absent once acknowledged)
  ackAt?: Iso
  ackBy?: string
  channel: string // "Push + page"
  /** Post-incident protocol: step id -> ISO time it was ticked. Persisted in the store (see lib/protocol.ts). */
  protocol?: Record<string, Iso>
  handledAt?: Iso
  history: AuditEvent[]
}

export interface FootageReview {
  id: string // FR-3301
  incidentId: string
  driveId: string
  vehicleId: string
  segment: string // "14:02:10 - 14:04:40"
  sev: Sev
  status: Status
  flags: Flag[]
  reviewerId?: string
  due: Iso
  findings: string[]
}

export interface Hazard {
  id: string
  label: string
  type: string
  state: 'Active' | 'Mitigated' | 'Stale'
  x: number
  y: number
  tagIds: string[]
  incidentIds: string[]
}

export interface Route {
  id: string
  name: string
  points: [number, number][] // schematic coordinates 0-100
}

export interface OddTarget {
  condition: OddCondition
  targetHours: number
  achievedHours: number
}
export interface Campaign {
  id: string
  name: string
  state: 'Planning' | 'Running' | 'Complete'
  vehicleIds: string[]
  targets: OddTarget[]
  drivesLogged: number // may be 0 or 10k+
}

/** Coverage segment on the 24h day axis. */
export interface CoverageSegment {
  id: string
  shiftId: ShiftId
  role: 'primary' | 'backup'
  kind: 'covered' | 'uncovered' | 'closed'
  start: Iso
  end: Iso
  leadId?: string
}

export interface DebtSnapshot {
  unreviewedFootage: number
  openIncidents: number
  staleEscalations: number
  uncoveredGaps: number // count of uncovered primary gaps
  total: number // plain sum of the four counts: reproducible by hand
}

/** A saved filter+sort view for a queue. `query` uses the FilterBar token syntax, e.g. `sev:2 owner:none shift:GY`. */
export interface SavedView {
  id: string
  name: string
  query: string
  pinned?: boolean
  shared?: boolean
}
export type QueueId = 'inbox' | 'owned' | 'review' | 'fleet'

/** One row in a Timeline. Newest first when returned by getTimeline(). */
export interface TimelineEvent {
  id: string
  at: Iso
  kind: 'tag' | 'incident' | 'status' | 'note' | 'escalation' | 'assign' | 'severity'
  actor?: string // display name
  verb: string // "tagged", "took ownership"
  object?: string // "Phantom brake"
  detail?: string
  sev?: Sev // renders a severity dot node
  status?: Status // renders the status marker (compact) on status-change nodes
  mapId?: string // marker id to highlight / reveal on the map (tag id)
}

export interface MapMarker {
  id: string
  kind: 'tag' | 'incident' | 'hazard' | 'vehicle'
  x: number // 0-100
  y: number
  label: string
  sev?: Sev
  hazardState?: Hazard['state']
  heading?: number // degrees, vehicles
  proposed?: boolean
}
