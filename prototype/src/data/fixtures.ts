/**
 * One coherent invented world. Frozen at FIXTURE_NOW (Thu 2026-10-29 15:42 UTC, PM shift active).
 * No real people, vehicles, places, or tools. Deliberate edge cases are marked EDGE.
 * Read through src/lib/queries.ts, not directly, so mutations from src/lib/store.ts show up.
 */
import type {
  AuditEvent, Campaign, CoverageSegment, DataHealth, Drive, Escalation, FootageReview, Flag, Hazard, HealthState,
  Incident, IssueTag, Lead, Operator, Program, QueueId, Repair, Route, SavedView, Shift, ShiftId, Sev, Status,
  TagType, Vehicle,
} from './types'
import { LIFECYCLE } from './types'
import { FIXTURE_NOW_MS, ago, at, iso, shiftOf, ms } from '../lib/time'

export const PROGRAM: Program = { id: 'PRG-01', name: 'Urban Automation Validation', site: 'Test Site Alder (invented)' }
/** Stated baseline for operators per lead, per shift. */
export const SPAN_BASELINE = 15
/** Escalation link timeout. */
export const ESC_TIMEOUT_SEC = 300

/* ---------------- people ---------------- */
const initials = (n: string) => {
  const p = n.split(/[\s-]+/).filter(Boolean)
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

export const SHIFTS: Shift[] = [
  { id: 'AM', name: 'AM', startHour: 6, endHour: 14, leadIds: ['LD-01', 'LD-02'], state: 'Closed' },
  { id: 'PM', name: 'PM', startHour: 14, endHour: 22, leadIds: ['LD-03', 'LD-04'], state: 'Active' },
  { id: 'GY', name: 'Night', startHour: 22, endHour: 6, leadIds: ['LD-05', 'LD-06'], state: 'Uncovered' }, // EDGE: has a gap 02:00-06:00
]

const L = (id: string, name: string, shiftId: ShiftId, role: 'Primary' | 'Backup', rotaOrder: number, over: Partial<Lead> = {}): Lead => ({
  id, name, initials: initials(name), shiftId, role, onCall: true, reachable: 'reachable', lastSeen: ago(1), rotaOrder, ...over,
})
export const LEADS: Lead[] = [
  L('LD-01', 'Priyanka Vandersloot', 'AM', 'Primary', 3, { lastSeen: ago(2) }),
  L('LD-02', 'Gideon Abara', 'AM', 'Backup', 4),
  // EDGE: very long name, currently unreachable (timed out on ESC-0206)
  L('LD-03', 'Marisol Quintanilla-Veyrat de la Cruz', 'PM', 'Primary', 1, { reachable: 'unreachable', lastSeen: ago(14) }),
  L('LD-04', 'Devika Raman', 'PM', 'Backup', 2, { lastSeen: ago(0) }),
  L('LD-05', 'Tobias Eklund-Nwosu', 'GY', 'Primary', 5, { onCall: false, reachable: 'unknown', lastSeen: ago(1100) }),
  L('LD-06', 'Hana Ostrowski', 'GY', 'Backup', 6, { onCall: false, reachable: 'unknown', lastSeen: ago(1500) }),
]
/** The signed-in user: PM backup lead. Used for "Owned / mine" and escalation takeover. */
export const ME_ID = 'LD-04'

const OPS: Record<ShiftId, string[]> = {
  AM: ['Tamsin Okonkwo-Ferreira', 'Ilya Brandvold', 'Noor Haddad', 'Jun Takeda', 'Bartholomew Oyelaran-Castellanos-Finch', 'Li Wei', 'Odalys Mbeki', 'Pavel Strnad', 'Sione Matagi'],
  PM: ['Rowan Achterberg', 'Esperanza Idowu', 'Kaveh Lindqvist', 'Mei-Ling Abernathy', 'Anselm Ruiz-Papadopoulos', 'Zainab Okoro', 'Dmitri Vasquez', 'Freya Njoroge', 'Cormac Delacroix', 'Yuki Aldous', 'Teodora Banerjee', 'Oluwaseun Kjellberg', 'Wen Li'],
  GY: ['Harlan Mzimba', 'Saoirse Quist', 'Ibrahim Tavares', 'Nadia Oyelowo-Sandoval', 'Matteo Brannigan', 'Chidi Halvorsen', 'Leocadia Fenwick', 'Vikram Osei'],
}
const CERTS = ['L2 closed course', 'L3 public road', 'Night', 'Rain', 'Emergency response']
export const OPERATORS: Operator[] = []
let opNo = 101
;(['AM', 'PM', 'GY'] as ShiftId[]).forEach((sid) =>
  OPS[sid].forEach((name, i) =>
    OPERATORS.push({
      id: `OP-${opNo++}`, name, initials: initials(name), shiftId: sid,
      status: sid === 'PM' ? 'On shift' : 'Off shift',
      certs: CERTS.filter((_, k) => (i + k) % 3 !== 1 || k === 0),
    }),
  ),
)
const opsOf = (s: ShiftId) => OPERATORS.filter((o) => o.shiftId === s)

/* ---------------- routes & hazards ---------------- */
export const ROUTES: Route[] = [
  { id: 'RT-A', name: 'Loop A (depot to harbour spur)', points: [[8, 80], [14, 55], [30, 40], [52, 36], [70, 24], [90, 18]] },
  { id: 'RT-B', name: 'Ring Road B', points: [[10, 20], [28, 12], [55, 14], [82, 30], [88, 58], [66, 84], [34, 86], [16, 70], [10, 20]] },
  { id: 'RT-C', name: 'Mill Street Spur', points: [[30, 40], [36, 58], [46, 66], [60, 64], [66, 84]] },
]
const routeXY = (rt: Route, f: number): [number, number] => {
  const p = rt.points
  const seg = f * (p.length - 1)
  const i = Math.min(p.length - 2, Math.floor(seg))
  const t = seg - i
  return [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t]
}
const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280

const H = (id: string, label: string, type: string, state: Hazard['state'], x: number, y: number): Hazard => ({ id, label, type, state, x, y, tagIds: [], incidentIds: [] })
export const HAZARDS: Hazard[] = [
  H('HZ-01', 'Overpass shadow, Loop A km 2', 'Shadow / glare', 'Active', 40, 38),
  H('HZ-02', 'Bus stop, Mill Street', 'Pedestrian', 'Active', 40, 62),
  H('HZ-03', 'Faded lane paint, Mill Street Spur', 'Lane marking', 'Active', 54, 66),
  H('HZ-04', 'Signal-less crossing, Ring Road B', 'Pedestrian', 'Active', 86, 44),
  H('HZ-05', 'Depot gate', 'Mixed traffic', 'Mitigated', 9, 76),
  H('HZ-06', 'Roundabout exit, Ring Road B', 'Yield', 'Active', 60, 20),
  H('HZ-07', 'Gravel shoulder, Loop A', 'Sensor', 'Active', 78, 21),
  H('HZ-08', 'Construction taper, Ring Road B', 'Lane closure', 'Mitigated', 30, 86),
  H('HZ-09', 'Tunnel mouth glare (west-facing)', 'Shadow / glare', 'Stale', 20, 44), // EDGE: zero tags, Stale
]
const hazardFor = (type: string, n: number): string | undefined =>
  ({
    'Phantom brake': n % 2 ? 'HZ-01' : 'HZ-02', 'Lane drift': 'HZ-03', 'Near miss': n % 2 ? 'HZ-04' : 'HZ-05',
    'Late yield': 'HZ-06', 'Sensor drop': 'HZ-07', 'Planner freeze': 'HZ-08',
  } as Record<string, string>)[type]

/* ---------------- vehicles ---------------- */
const CONDITIONS = [
  'Good. Fresh calibration 10/27.',
  'Good. Minor stone chips on hood.',
  'Front-left tyre at 2.1 bar, topped up before drive; slow leak suspected; scheduled for wheel pull on next availability window.',
  'Good.', 'Cabin camera lens cleaned. Rear seat latch sticks.', 'Good. Wipers replaced.', 'Calibration due in 3 days.', 'Good.',
  'Good. Roof sensor pod re-torqued after pothole.',
]
const HEALTH_OVERRIDE: Record<number, Partial<DataHealth>> = {
  3: { storagePct: 88 },
  5: { writeRate: 6100 },
  9: { syncSkewMs: 14 },
  0: { syncSkewMs: 31, note: 'Lidar sync skew over limit' }, // EDGE: Failing on an active drive, safety-relevant -> SEV1
  15: { writeRate: 0, storagePct: 97 }, 16: { writeRate: 0 }, 17: { writeRate: 0 }, 18: { writeRate: 0 }, 19: { writeRate: 0 },
  21: { writeRate: 0 }, 22: { writeRate: 0 },
}
const deriveHealth = (status: Vehicle['status'], base: DataHealth): DataHealth => {
  let state: HealthState = 'Healthy'
  const active = status === 'In drive'
  if (base.syncSkewMs > 20 || base.storagePct >= 95) state = 'Failing'
  else if (base.syncSkewMs > 8 || base.storagePct >= 85 || (active && base.writeRate < base.writeRateNominal * 0.9)) state = 'Degraded'
  if (status === 'Down' || status === 'Retired') state = base.storagePct >= 95 ? 'Failing' : 'Healthy'
  const safety = base.syncSkewMs > 20
  const sev: Sev | undefined = state === 'Healthy' ? undefined : state === 'Degraded' ? 3 : active && safety ? 1 : 2
  return { ...base, state, sev }
}
export const VEHICLES: Vehicle[] = Array.from({ length: 24 }, (_, i) => {
  const status: Vehicle['status'] = i < 9 ? 'In drive' : i < 15 ? 'Available' : i < 20 ? 'Down' : i === 21 || i === 22 ? 'Retired' : 'Available'
  const nominal = 10000
  const base: DataHealth = {
    vehicleId: '', writeRate: status === 'In drive' ? 9800 + (i % 3) * 60 : status === 'Available' ? 9900 : 0,
    writeRateNominal: nominal, storagePct: 31 + ((i * 13) % 50), syncSkewMs: 2 + (i % 5), state: 'Healthy', asOf: ago(1), ...HEALTH_OVERRIDE[i],
  }
  const id = `FV-0${101 + i}`
  base.vehicleId = id
  return {
    id, nickname: i === 4 ? 'The Long Wheelbase Prototype With A Very Long Nickname Indeed' : undefined, // EDGE: long nickname
    build: i % 4 === 0 ? '2026.41.3-rc2' : i % 4 === 1 ? '2026.41.4' : '2026.40.9', condition: CONDITIONS[i % CONDITIONS.length], status,
    health: deriveHealth(status, base),
    eventsToday: status === 'In drive' ? (i === 2 ? 10412 : 4000 + i * 311) : 0, // EDGE: one 10k+, many 0
    repairs: [],
  }
})
// EDGE: FV-0123 (idx 22 retired) and FV-0124 (idx 23 available) never appear in an incident: zero counts.

/* ---------------- incident table ---------------- */
type Row = [n: number, sev: Sev, status: Status, type: string, title: string, owner: string | null, ageMin: number, flags?: Flag[]]
const ROWS: Row[] = [
  [4140, 1, 'Triaged', 'Collision', 'Unexpected full stop on merge; contact from following third-party vehicle', null, 1, ['Escalated']],
  [4139, 1, 'Triaged', 'Sensor drop', 'Lidar sync lost mid-drive; planner fell back to limited mode', null, 8, ['Escalated']],
  [4138, 2, 'Captured', 'Phantom brake', 'Phantom brake under overpass; no obstacle in perception log', null, 14],
  [4137, 3, 'Captured', 'HMI glitch', 'Takeover chime plays twice, second one 1.4 s late', null, 22],
  [4136, 2, 'Captured', 'Planner freeze', 'Planner froze 3 s at unprotected left, resumed without input', null, 35],
  [4135, 2, 'Triaged', 'Lane drift', 'Lane-keep drifts toward shoulder on faded paint, Mill Street Spur', null, 52],
  [4134, 3, 'Triaged', 'Data quality', 'Camera 3 timestamp skew above spec for 11 min', null, 71],
  [4133, 2, 'Owned', 'Phantom brake', 'Repeat phantom brake near bus stop (third this week)', 'LD-04', 95],
  [4132, 3, 'Owned', 'Cosmetic', 'Front bumper scuff after cone strike on closed course', 'LD-03', 140],
  [4131, 2, 'Owned', 'Late yield', 'Late yield to cut-in at roundabout exit', 'LD-04', 190, ['Overdue']],
  [4130, 1, 'Owned', 'Near miss', 'Pedestrian entered crossing outside signal phase; operator took over', 'LD-04', 260, ['Escalated']],
  [4129, 3, 'Captured', 'Data quality', 'Upload backlog of 2.1 GB after drive', null, 300],
  [4128, 3, 'Captured', 'Other', 'Rattle from rear hatch at 40 km/h', null, 300], // EDGE: tie with 4129 on sev and age
  [4127, 2, 'Owned', 'Sensor drop', 'Radar 2 dropped for 800 ms on gravel shoulder', 'LD-03', 330],
  [4126, 2, 'Owned', 'Sensor drop', 'Radar 2 dropped for 800 ms on gravel shoulder (second occurrence)', 'LD-03', 330], // EDGE: tie
  [4125, 2, 'Resolved', 'Planner freeze', 'Planner freeze traced to map tile cache; patched in 2026.41.4', 'LD-04', 480],
  [4124, 3, 'Resolved', 'HMI glitch', 'Instrument cluster flicker on cold start', 'LD-02', 610],
  [4123, 1, 'Resolved', 'Collision', 'Low-speed contact with bollard in depot; no injury', 'LD-03', 720, ['Escalated']],
  [4122, 2, 'Owned', 'Phantom brake', 'Phantom brake in tunnel entry glare', 'LD-01', 900, ['Stale']],
  [4121, 2, 'Triaged', 'Near miss', 'Two test vehicles needed simultaneous avoidance at the depot gate', null, 1000],
  [4120, 3, 'Verified', 'Cosmetic', 'Windscreen chip, driver side', 'LD-02', 1300],
  [4119, 2, 'Verified', 'Lane drift', 'Lane-keep oscillation on concrete expansion joints', 'LD-04', 1500],
  [4118, 3, 'Owned', 'Data quality', 'GNSS drift of about 6 m under tree canopy', 'LD-03', 1800, ['Stale']],
  [4117, 2, 'Owned', 'Sensor drop', 'Front camera blinded by low sun; recovered after 4 s', 'LD-05', 2100, ['Overdue']],
  [4116, 3, 'Resolved', 'Other', 'Seat-belt chime false positive with cargo on seat', 'LD-05', 2400],
  [4115, 1, 'Verified', 'Near miss', 'Cyclist overtaken inside minimum gap; planner margin issue', 'LD-03', 2700, ['Escalated']],
  [4114, 2, 'Resolved', 'Late yield', 'Late yield at four-way stop with pedestrian waiting', 'LD-01', 3000, ['Overdue']],
  [4113, 3, 'Verified', 'HMI glitch', 'Wrong units on speed readout after software update', 'LD-06', 3300],
  [4112, 2, 'Owned', 'Planner freeze', 'Planner freeze on construction taper; manual takeover', 'LD-01', 3600],
  [4111, 2, 'Owned', 'Planner freeze', 'Planner freeze on construction taper; manual takeover (other vehicle)', 'LD-01', 3600], // EDGE: tie
  [4110, 3, 'Triaged', 'Cosmetic', 'Door seal worn, wind noise above 60 km/h', null, 4200, ['Stale']],
  [4109, 2, 'Verified', 'Phantom brake', 'Phantom brake at shadow of footbridge', 'LD-04', 5000],
  [4108, 3, 'Verified', 'Data quality', 'Missing CAN frames for 2 s after ignition', 'LD-02', 6000],
  [4107, 2, 'Resolved', 'Sensor drop', 'Lidar mounting loose after pothole; retorqued', 'LD-05', 7200],
  [4106, 1, 'Verified', 'Collision', 'Rear contact at low speed in queue; third-party details exchanged on site', 'LD-01', 8000, ['Escalated']],
  [4105, 3, 'Verified', 'Other', 'Cabin camera lens fogged', 'LD-06', 9000],
  [4104, 2, 'Owned', 'Lane drift', 'Lane-keep fights operator input on tight curve, Ring Road B km 3 (long-running, awaiting map update from planning)', 'LD-03', 10000, ['Overdue', 'Stale']], // EDGE: long title, two flags
  [4103, 3, 'Verified', 'Cosmetic', 'Roof rack bracket cracked', 'LD-02', 12000],
  [4102, 2, 'Verified', 'Late yield', 'Hesitation at flashing amber', 'LD-04', 14000],
  [4101, 3, 'Verified', 'HMI glitch', 'Haptic seat pulse stuck on for 30 s', 'LD-06', 16000],
]
const TAGTYPE: Record<string, TagType> = {
  'Phantom brake': 'Phantom brake', 'Planner freeze': 'Planner freeze', 'Sensor drop': 'Sensor drop', 'Lane drift': 'Lane drift',
  'Late yield': 'Late yield', 'HMI glitch': 'HMI glitch',
}
const TAGSEV: Record<TagType, Sev> = { 'Phantom brake': 2, 'Planner freeze': 2, 'Sensor drop': 2, 'Lane drift': 2, 'Late yield': 2, 'HMI glitch': 3, Other: 3 }

export const DRIVES: Drive[] = []
export const TAGS: IssueTag[] = []
export const INCIDENTS: Incident[] = []
export const ESCALATIONS: Escalation[] = []
export const CAMPAIGNS: Campaign[] = [
  { id: 'CMP-1', name: 'Urban Merge Validation Q4', state: 'Running', vehicleIds: ['FV-0101', 'FV-0102', 'FV-0103', 'FV-0104', 'FV-0110', 'FV-0111'], drivesLogged: 10412, // EDGE: 10k+
    targets: [{ condition: 'Day', targetHours: 80, achievedHours: 62 }, { condition: 'Night', targetHours: 60, achievedHours: 31 }, { condition: 'Rain', targetHours: 24, achievedHours: 4 }, { condition: 'Dense traffic', targetHours: 40, achievedHours: 40 }] },
  { id: 'CMP-2', name: 'Highway Lane-Keep Regression', state: 'Running', vehicleIds: ['FV-0105', 'FV-0106', 'FV-0107'], drivesLogged: 388,
    targets: [{ condition: 'Day', targetHours: 50, achievedHours: 21 }, { condition: 'Night', targetHours: 30, achievedHours: 0 }, { condition: 'Rain', targetHours: 12, achievedHours: 0 }, { condition: 'Dense traffic', targetHours: 10, achievedHours: 2 }] }, // EDGE: zero achieved
  { id: 'CMP-3', name: 'Closed-Course Braking Suite', state: 'Complete', vehicleIds: ['FV-0108', 'FV-0109'], drivesLogged: 1204,
    targets: [{ condition: 'Day', targetHours: 20, achievedHours: 20 }, { condition: 'Night', targetHours: 8, achievedHours: 8 }, { condition: 'Rain', targetHours: 8, achievedHours: 9 }, { condition: 'Dense traffic', targetHours: 0, achievedHours: 0 }] },
  { id: 'CMP-4', name: 'Winter Pack Prep', state: 'Planning', vehicleIds: [], drivesLogged: 0, targets: [] }, // EDGE: empty campaign
]
const campaignFor = (v: number) => (v < 4 || v === 10 || v === 11 ? 'CMP-1' : v < 8 ? 'CMP-2' : 'CMP-3')
const ODDS = (n: number): Drive['odd'] => (n % 4 === 0 ? ['Night'] : n % 4 === 1 ? ['Day', 'Dense traffic'] : n % 4 === 2 ? ['Day', 'Rain'] : ['Day'])

// Active drives (one per In-drive vehicle). Vehicle 1 runs an AM operator on overtime (ESC-0207).
const activeOps = [opsOf('PM')[0], opsOf('AM')[0], ...opsOf('PM').slice(1, 8)]
for (let v = 0; v < 9; v++) {
  const id = `DR-95${String(v + 1).padStart(2, '0')}`
  DRIVES.push({ id, vehicleId: VEHICLES[v].id, operatorId: activeOps[v].id, routeId: ROUTES[v % 3].id, campaignId: campaignFor(v), start: ago(25 + v * 17), state: 'Active', odd: ODDS(v) })
  VEHICLES[v].currentDriveId = id
  activeOps[v].currentDriveId = id
  activeOps[v].status = 'On shift'
}
const opById = (id: string) => OPERATORS.find((o) => o.id === id)!

let tagNo = 20900
const addTag = (driveId: string, type: TagType, tAt: string, extra: Partial<IssueTag> = {}): IssueTag => {
  const d = DRIVES.find((x) => x.id === driveId)!
  const rt = ROUTES.find((r) => r.id === d.routeId)!
  const k = ++tagNo
  const [x, y] = routeXY(rt, 0.1 + rnd(k) * 0.8)
  const tag: IssueTag = {
    id: `TG-${k}`, type, at: tAt, driveId, vehicleId: d.vehicleId, operatorId: d.operatorId, shiftId: opById(d.operatorId).shiftId,
    locationLabel: `${rt.name.split(' (')[0]}, ~${(1 + rnd(k + 1) * 8).toFixed(1)} km`, x, y, proposedSev: TAGSEV[type], state: 'Captured', ...extra,
  }
  TAGS.push(tag)
  return tag
}

const REPORT_VERB: Record<string, string> = { Collision: 'reported contact', 'Near miss': 'reported a near miss' }
ROWS.forEach(([n, sev, status, type, title, owner, age, flags = []]) => {
  const createdMs = FIXTURE_NOW_MS - age * 60_000
  const createdAt = iso(createdMs)
  const sid = shiftOf(createdMs)
  const active = n === 4139 ? 0 : n === 4140 ? 1 : -1
  const vIdx = active >= 0 ? active : (n * 7) % 22
  const veh = VEHICLES[vIdx]
  const ops = opsOf(sid)
  let driveId: string
  if (active >= 0) driveId = veh.currentDriveId!
  else {
    driveId = `DR-${9000 + n}`
    const op = ops[n % ops.length]
    DRIVES.push({ id: driveId, vehicleId: veh.id, operatorId: op.id, routeId: ROUTES[n % 3].id, campaignId: campaignFor(vIdx), start: iso(createdMs - 45 * 60_000), end: iso(createdMs + 25 * 60_000), state: status === 'Verified' ? 'Reviewed' : 'Ended', odd: ODDS(n) })
  }
  const drive = DRIVES.find((d) => d.id === driveId)!
  const driveIds = [driveId]
  const vehicleIds = [veh.id]
  if (n === 4121) { // EDGE: multi-vehicle, multi-drive incident
    const v2 = VEHICLES[(vIdx + 3) % 22]
    const d2 = `DR-${9000 + n}b`
    DRIVES.push({ id: d2, vehicleId: v2.id, operatorId: ops[(n + 1) % ops.length].id, routeId: ROUTES[0].id, campaignId: campaignFor(vIdx), start: iso(createdMs - 30 * 60_000), end: iso(createdMs + 10 * 60_000), state: 'Ended', odd: ODDS(n) })
    driveIds.push(d2); vehicleIds.push(v2.id)
  }
  // tags
  const nTags = sev === 1 ? 3 : n % 3 === 0 ? 2 : 1
  const tagType: TagType = TAGTYPE[type] ?? 'Other'
  const tagIds: string[] = []
  for (let k = 0; k < nTags; k++) {
    const tg = addTag(driveIds[k % driveIds.length], k === 0 ? tagType : 'Other', iso(createdMs - (nTags - k) * 40_000), { state: 'Triaged', incidentId: `INC-${n}`, proposedSev: sev })
    const hid = hazardFor(type, n)
    const hz = HAZARDS.find((h) => h.id === hid)
    if (hz) { tg.x = hz.x + (rnd(n + k) - 0.5) * 4; tg.y = hz.y + (rnd(n + k + 9) - 0.5) * 4; tg.locationLabel = hz.label; hz.tagIds.push(tg.id) }
    tagIds.push(tg.id)
  }
  const hazardId = hazardFor(type, n)
  if (hazardId) HAZARDS.find((h) => h.id === hazardId)!.incidentIds.push(`INC-${n}`)
  const idle = flags.includes('Stale') ? 4400 : Math.min(age, 20 + ((n * 37) % 180))
  const updatedAt = iso(FIXTURE_NOW_MS - Math.min(age, idle) * 60_000)
  // audit history
  const history: AuditEvent[] = []
  const evt = (e: Omit<AuditEvent, 'id'>) => history.push({ ...e, id: `EV-${n}-${history.length + 1}` })
  tagIds.forEach((tid) => { const tg = TAGS.find((t) => t.id === tid)!; evt({ at: tg.at, actorId: tg.operatorId, kind: 'tag', text: `tagged "${tg.type}"`, sev: tg.proposedSev, tagId: tid }) })
  evt({ at: createdAt, actorId: drive.operatorId, kind: 'opened', text: `${REPORT_VERB[type] ?? 'opened incident'}`, status: 'Captured', sev })
  const span = Math.max(1, (ms(updatedAt) - createdMs) / 1000)
  const step = (i: number) => iso(createdMs + (span * 1000 * i) / 5)
  const lvl = LIFECYCLE.indexOf(status)
  const leadFor = owner ?? LEADS.find((l) => l.shiftId === sid)!.id
  if (lvl >= 1) evt({ at: step(1), actorId: leadFor, kind: 'triaged', text: `triaged as SEV${sev}`, status: 'Triaged', sev })
  if (lvl >= 2 && owner) evt({ at: step(2), actorId: owner, kind: 'assigned', text: 'took ownership', status: 'Owned' })
  if (lvl >= 3 && owner) evt({ at: step(3), actorId: owner, kind: 'resolved', text: 'marked resolved', status: 'Resolved' })
  const verifier = owner ? LEADS.find((l) => l.id !== owner && l.shiftId !== LEADS.find((x) => x.id === owner)!.shiftId)?.id ?? 'LD-01' : 'LD-01'
  if (lvl >= 4) evt({ at: step(4), actorId: verifier, kind: 'verified', text: 'verified (not the resolver)', status: 'Verified' })
  history.sort((a, b) => a.at.localeCompare(b.at))
  INCIDENTS.push({
    id: `INC-${n}`, title, type, sev, sevProposed: status === 'Captured' || status === 'Triaged' && sev !== 1 && n % 2 === 0, status, flags, vehicleIds, driveIds, tagIds,
    reporterId: drive.operatorId, ownerId: owner ?? undefined, resolvedBy: lvl >= 3 ? owner ?? undefined : undefined, verifiedBy: lvl >= 4 ? verifier : undefined,
    shiftId: sid, hazardId, createdAt, updatedAt, dueAt: lvl < 3 ? iso(createdMs + (sev === 1 ? 4 : sev === 2 ? 24 : 168) * 3600_000) : undefined,
    notes: n % 5 === 0 ? ['Operator notes: second occurrence this week on the same segment.'] : [], history, escalationIds: [],
  })
})
INCIDENTS.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

// Untriaged tags (Inbox): includes a tag with no proposed hazard and one SEV1-proposed. EDGE: 9 tags, various ages.
const untriaged: [number, TagType, number, Partial<IssueTag>?][] = [
  [0, 'Phantom brake', 4], [2, 'Sensor drop', 9], [3, 'Planner freeze', 12, { proposedSev: 1 }], [4, 'Lane drift', 17], [5, 'HMI glitch', 21],
  [6, 'Late yield', 26], [7, 'Other', 33], [8, 'Phantom brake', 38], [2, 'Phantom brake', 44],
]
untriaged.forEach(([v, type, min, extra]) => addTag(`DR-95${String(v + 1).padStart(2, '0')}`, type, ago(min), extra))
// Re-point tag operators for active drives to match drive operators (done in addTag).

/* ---------------- escalations ---------------- */
const inc = (n: number) => INCIDENTS.find((i) => i.id === `INC-${n}`)!
const addEsc = (e: Escalation) => { ESCALATIONS.push(e); const i = INCIDENTS.find((x) => x.id === e.incidentId)!; i.escalationIds.push(e.id) }
const raisedMs = FIXTURE_NOW_MS - 48_000
const op0207 = DRIVES.find((d) => d.id === VEHICLES[1].currentDriveId)!.operatorId
const op0206 = DRIVES.find((d) => d.id === VEHICLES[0].currentDriveId)!.operatorId
const evtE = (id: string, at_: number, actor: string, kind: AuditEvent['kind'], text: string): AuditEvent => ({ id, at: iso(at_), actorId: actor, kind, text })
addEsc({
  id: 'ESC-0207', incidentId: 'INC-4140', raisedAt: iso(raisedMs), state: 'Raised', currentIndex: 1, timeoutSec: ESC_TIMEOUT_SEC,
  deadline: iso(raisedMs + ESC_TIMEOUT_SEC * 1000), channel: 'Push + page',
  chain: [
    { role: 'Raised by', personId: op0207, personKind: 'operator', reachable: 'reachable', link: 'done', at: iso(raisedMs) },
    { role: 'Current owner', personId: 'LD-01', personKind: 'lead', reachable: 'reachable', link: 'current' },
    { role: 'Backup (rota)', personId: 'LD-02', personKind: 'lead', reachable: 'reachable', link: 'next' },
  ],
  history: [evtE('E7-1', raisedMs, op0207, 'escalated', 'raised SEV1 collision call'), evtE('E7-2', raisedMs + 2000, 'SYS', 'note', 'Paged LD-01 (push + page); backup LD-02 notified silently')],
})
const raised6 = FIXTURE_NOW_MS - 500_000 // 8m20s ago
const rerouted6 = raised6 + ESC_TIMEOUT_SEC * 1000 // 3m20s ago
addEsc({
  id: 'ESC-0206', incidentId: 'INC-4139', raisedAt: iso(raised6), state: 'Timed out', currentIndex: 2, timeoutSec: ESC_TIMEOUT_SEC,
  deadline: iso(rerouted6 + ESC_TIMEOUT_SEC * 1000), channel: 'Push + page',
  chain: [
    { role: 'Raised by', personId: op0206, personKind: 'operator', reachable: 'reachable', link: 'done', at: iso(raised6) },
    { role: 'Current owner', personId: 'LD-03', personKind: 'lead', reachable: 'unreachable', link: 'timed-out', at: iso(rerouted6) },
    { role: 'Backup (rota)', personId: 'LD-04', personKind: 'lead', reachable: 'reachable', link: 'current', at: iso(rerouted6) },
  ],
  history: [
    evtE('E6-1', raised6, op0206, 'escalated', 'raised SEV1: lidar sync lost'),
    evtE('E6-2', raised6 + 2000, 'SYS', 'note', 'Paged LD-03 (push + page)'),
    evtE('E6-3', rerouted6, 'SYS', 'rerouted', 'No acknowledgement in 05:00. Re-routed to LD-04 (next on rota)'),
  ],
})
const handled = (id: string, n: number, who: string, minAgo: number): Escalation => {
  const r = FIXTURE_NOW_MS - minAgo * 60_000
  const op = inc(n).reporterId
  return {
    id, incidentId: `INC-${n}`, raisedAt: iso(r), state: 'Handled', currentIndex: 1, timeoutSec: ESC_TIMEOUT_SEC, channel: 'Push + page', ackAt: iso(r + 70_000), ackBy: who,
    chain: [
      { role: 'Raised by', personId: op, personKind: 'operator', reachable: 'reachable', link: 'done', at: iso(r) },
      { role: 'Current owner', personId: who, personKind: 'lead', reachable: 'reachable', link: 'done', at: iso(r + 70_000) },
      { role: 'Backup (rota)', personId: who === 'LD-03' ? 'LD-04' : 'LD-02', personKind: 'lead', reachable: 'reachable', link: 'next' },
    ],
    history: [evtE(`${id}-1`, r, op, 'escalated', 'raised SEV1'), evtE(`${id}-2`, r + 70_000, who, 'ack', 'acknowledged'), evtE(`${id}-3`, r + 900_000, who, 'resolved', 'handled')],
  }
}
addEsc(handled('ESC-0204', 4130, 'LD-04', 260))
addEsc(handled('ESC-0198', 4123, 'LD-03', 720))
addEsc(handled('ESC-0187', 4115, 'LD-03', 2700))
addEsc(handled('ESC-0171', 4106, 'LD-01', 8000))
// Escalation events appear on the incident audit trail.
ESCALATIONS.forEach((e) => {
  const i = INCIDENTS.find((x) => x.id === e.incidentId)!
  e.history.forEach((h) => i.history.push({ ...h, id: `${i.id}-${h.id}` }))
  i.history.sort((a, b) => a.at.localeCompare(b.at))
})

/* ---------------- footage reviews: derived from incidents (Gate 1: audit every incident) ---------------- */
export const FOOTAGE: FootageReview[] = INCIDENTS.map((i, k) => {
  const dueMs = ms(i.createdAt) + (i.sev === 1 ? 4 : i.sev === 2 ? 24 : 168) * 3600_000
  const lvl = LIFECYCLE.indexOf(i.status)
  const status: Status = lvl <= 1 ? 'Captured' : lvl === 2 ? (k % 2 ? 'Triaged' : 'Owned') : i.status
  const flags: Flag[] = []
  if (LIFECYCLE.indexOf(status) < 3 && dueMs < FIXTURE_NOW_MS) flags.push('Overdue')
  const t0 = ms(i.createdAt) - 2 * 60_000
  const f = (t: number) => new Date(t).toISOString().slice(11, 19)
  return {
    id: `FR-${3300 + INCIDENTS.length - k}`, incidentId: i.id, driveId: i.driveIds[0], vehicleId: i.vehicleIds[0], segment: `${f(t0)} - ${f(t0 + 150_000)}`,
    sev: i.sev, status, flags, reviewerId: lvl >= 2 ? i.ownerId : undefined, due: iso(dueMs),
    findings: lvl >= 3 ? ['Operator response within limits.', i.sev < 3 ? 'Planner state confirms the logged fault.' : 'No further findings.'] : [],
  }
})

/* ---------------- repairs (read-only, Gate-1 assumption Q3) ---------------- */
const addRepair = (vIdx: number, part: string, sev: Sev, status: Status, tech: string, incN?: number) => {
  const r: Repair = { id: `RP-${700 + VEHICLES[vIdx].repairs.length + vIdx}`, vehicleId: VEHICLES[vIdx].id, part, sev, status, technician: tech, incidentId: incN ? `INC-${incN}` : undefined, reportedAt: ago(3000 + vIdx * 400) }
  VEHICLES[vIdx].repairs.push(r)
}
addRepair(15, 'Front bumper cover', 3, 'Owned', 'Technician R. Pell', 4132)
addRepair(16, 'Lidar mount bracket', 2, 'Owned', 'Technician R. Pell', 4107)
addRepair(17, 'Rear collision sensor and tailgate', 1, 'Owned', 'Technician A. Ndiaye', 4123)
addRepair(18, 'Windscreen', 3, 'Verified', 'Technician A. Ndiaye', 4120)
addRepair(19, 'Roof rack bracket', 3, 'Resolved', 'Technician R. Pell', 4103)
addRepair(19, 'Cabin camera', 3, 'Captured', 'Unassigned')

/* ---------------- coverage (24h axis, 06:00 to 06:00) ---------------- */
const seg = (id: string, shiftId: ShiftId, role: 'primary' | 'backup', kind: CoverageSegment['kind'], s: string, e: string, leadId?: string): CoverageSegment => ({ id, shiftId, role, kind, start: s, end: e, leadId })
export const COVERAGE: CoverageSegment[] = [
  seg('C1', 'AM', 'primary', 'covered', at(6), at(14), 'LD-01'),
  seg('C2', 'AM', 'backup', 'covered', at(6), at(14), 'LD-02'),
  seg('C3', 'PM', 'primary', 'covered', at(14), at(22), 'LD-03'),
  seg('C4', 'PM', 'backup', 'covered', at(14), at(20), 'LD-04'),
  seg('C5', 'PM', 'backup', 'uncovered', at(20), at(22)), // no backup 20:00-22:00
  seg('C6', 'GY', 'primary', 'covered', at(22), at(2, 0, 1), 'LD-05'),
  seg('C7', 'GY', 'primary', 'uncovered', at(2, 0, 1), at(6, 0, 1)), // EDGE: uncovered gap 02:00-06:00
  seg('C8', 'GY', 'backup', 'covered', at(22), at(2, 0, 1), 'LD-06'),
  seg('C9', 'GY', 'backup', 'uncovered', at(2, 0, 1), at(6, 0, 1)),
]

/* ---------------- oversight debt: last shift snapshot + 14-day history ---------------- */
export const DEBT_LAST_SHIFT = { unreviewedFootage: 17, openIncidents: 15, staleEscalations: 0, uncoveredGaps: 0 }
export const DEBT_HISTORY: number[] = [22, 24, 27, 26, 31, 33, 30, 34, 38, 41, 37, 40, 43, 44] // daily totals, oldest first

/* ---------------- saved views ---------------- */
export const SAVED_VIEWS: Record<QueueId, SavedView[]> = {
  inbox: [
    { id: 'in-all', name: 'All new', query: '', pinned: true },
    { id: 'in-sev12', name: 'SEV1-2 unowned', query: 'sev:1,2 owner:none', pinned: true },
    { id: 'in-gy', name: 'SEV2 unowned, night shift', query: 'sev:2 owner:none shift:GY', pinned: true, shared: true },
    { id: 'in-tags', name: 'Untriaged tags only', query: 'kind:tag' },
  ],
  owned: [
    { id: 'ow-mine', name: 'Mine', query: 'owner:me', pinned: true },
    { id: 'ow-stale', name: 'Stale or overdue', query: 'flag:stale,overdue owner:me', pinned: true },
  ],
  review: [
    { id: 'rv-due', name: 'Due today', query: 'due:today', pinned: true },
    { id: 'rv-over', name: 'Overdue', query: 'flag:overdue', pinned: true },
  ],
  fleet: [
    { id: 'fl-down', name: 'Down or degraded', query: 'status:down,degraded', pinned: true },
  ],
}
