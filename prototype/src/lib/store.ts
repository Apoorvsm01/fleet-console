/**
 * Tiny in-memory mutation layer over the fixtures so actions feel real (ack an escalation, assign an owner...).
 * Resets on page reload. Call `useStore()` at the top of any component that reads from queries.ts and must re-render after a mutation.
 */
import { useSyncExternalStore } from 'react'
import { ESC_TIMEOUT_SEC, ESCALATIONS, FOOTAGE, INCIDENTS, LEADS, TAGS } from '../data/fixtures'
import { LIFECYCLE, type AuditEvent, type ChainLink, type Escalation, type IssueTag, type Sev, type Status, type TagType } from '../data/types'
import { PROTOCOL_STEPS } from './protocol'
import { iso, shiftOf } from './time'
import { simNowMs } from './clock'
import { ME_ID } from '../data/fixtures'

let version = 0
const subs = new Set<() => void>()
const bump = () => { version++; subs.forEach((f) => f()) }
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

/** Returns a version number that changes after every mutation. Ignore the value; calling it subscribes the component. */
export const useStore = (): number => useSyncExternalStore(subscribe, () => version)

const ev = (actorId: string, kind: AuditEvent['kind'], text: string, extra: Partial<AuditEvent> = {}): AuditEvent => ({
  id: `EV-${Math.random().toString(36).slice(2, 8)}`, at: iso(simNowMs()), actorId, kind, text, ...extra,
})
const inc = (id: string) => INCIDENTS.find((i) => i.id === id)
const touch = (id: string, e: AuditEvent) => { const i = inc(id); if (i) { i.history.push(e); i.updatedAt = e.at } }

export function acknowledgeEscalation(id: string, by: string = ME_ID): void {
  const e = ESCALATIONS.find((x) => x.id === id)
  if (!e || (e.state !== 'Raised' && e.state !== 'Timed out')) return
  e.state = 'Acknowledged'; e.ackAt = iso(simNowMs()); e.ackBy = by; e.deadline = undefined
  e.chain[e.currentIndex].link = 'done'
  const x = ev(by, 'ack', 'acknowledged'); e.history.push(x); touch(e.incidentId, x)
  const i = inc(e.incidentId)
  if (i && !i.ownerId) assignOwner(i.id, by)
  bump()
}
/** Hand an active escalation to another lead (pre-selected: the rota backup). Restarts the countdown for them. */
export function handOffEscalation(id: string, toLeadId: string, by: string = ME_ID): void {
  const e = ESCALATIONS.find((x) => x.id === id)
  if (!e) return
  e.chain[e.currentIndex].link = 'done'
  const existing = e.chain.findIndex((c) => c.personId === toLeadId)
  const idx = existing >= 0 ? existing : e.chain.length - 1
  if (existing < 0) e.chain[idx] = { ...e.chain[idx], personId: toLeadId }
  e.chain[idx].link = 'current'; e.currentIndex = idx
  e.state = 'Raised'; e.deadline = iso(simNowMs() + e.timeoutSec * 1000)
  const x = ev(by, 'rerouted', `handed off to ${toLeadId}`); e.history.push(x); touch(e.incidentId, x)
  bump()
}
export function assignOwner(incidentId: string, ownerId: string, by: string = ME_ID): void {
  const i = inc(incidentId); if (!i) return
  i.ownerId = ownerId
  if (LIFECYCLE.indexOf(i.status) < 2) i.status = 'Owned'
  touch(i.id, ev(by, 'assigned', `assigned to ${ownerId}`, { status: i.status }))
  bump()
}
export function setSeverity(incidentId: string, sev: Sev, by: string = ME_ID): void {
  const i = inc(incidentId); if (!i) return
  i.sev = sev; i.sevProposed = false
  touch(i.id, ev(by, 'severity', `set severity to SEV${sev}`, { sev }))
  bump()
}
/** Move forward one step. Verified requires a person other than the resolver; returns false (and does nothing) otherwise. */
export function advanceStatus(incidentId: string, by: string = ME_ID): boolean {
  const i = inc(incidentId); if (!i) return false
  const lvl = LIFECYCLE.indexOf(i.status)
  if (lvl >= 4) return false
  const next: Status = LIFECYCLE[lvl + 1]
  if (next === 'Verified' && i.resolvedBy === by) return false
  if (next === 'Resolved') i.resolvedBy = by
  if (next === 'Verified') i.verifiedBy = by
  i.status = next
  touch(i.id, ev(by, next === 'Verified' ? 'verified' : next === 'Resolved' ? 'resolved' : 'triaged', `moved to ${next}`, { status: next }))
  bump()
  return true
}
/** Proposed severity by tag type: the SEV? the Inbox shows until a lead confirms. Safety-critical behaviours SEV2, cosmetic or unknown SEV3. Invented, needs safety-owner review. */
export const TAG_TYPE_SEV: Record<TagType, Sev> = {
  'Phantom brake': 2, 'Planner freeze': 2, 'Sensor drop': 2, 'Lane drift': 2, 'Late yield': 2, 'HMI glitch': 3, Other: 3,
}
export const proposedSevFor = (type: TagType): Sev => TAG_TYPE_SEV[type]
export interface CaptureTagInput {
  type: TagType; driveId: string; vehicleId: string; operatorId: string; shiftId: IssueTag['shiftId']
  locationLabel: string; x?: number; y?: number; at?: string
}
/** Create a Captured tag with the severity proposed from its type. Notifies subscribers. Returns the new tag. */
export function captureTag(input: CaptureTagInput): IssueTag {
  const n = Math.max(20900, ...TAGS.map((t) => Number(t.id.slice(3)) || 0)) + 1
  const t: IssueTag = {
    id: `TG-${n}`, type: input.type, at: input.at ?? iso(simNowMs()), driveId: input.driveId, vehicleId: input.vehicleId,
    operatorId: input.operatorId, shiftId: input.shiftId, locationLabel: input.locationLabel, x: input.x ?? 50, y: input.y ?? 50,
    proposedSev: proposedSevFor(input.type), state: 'Captured',
  }
  TAGS.push(t)
  bump()
  return t
}
/** Undo for captureTag: removes a tag that is still Captured (triaged tags are kept). Returns true if removed. */
export function removeTag(id: string): boolean {
  const i = TAGS.findIndex((t) => t.id === id)
  if (i < 0 || TAGS[i].state !== 'Captured') return false
  TAGS.splice(i, 1)
  bump()
  return true
}
export function dismissTags(tagIds: string[]): void {
  TAGS.forEach((t) => { if (tagIds.includes(t.id)) { t.state = 'Dismissed' } })
  bump()
}
/** Undo for dismissTags: dismissed tags go back to Captured. Safe to call twice. */
export function undismissTags(tagIds: string[]): void {
  TAGS.forEach((t) => { if (tagIds.includes(t.id) && t.state === 'Dismissed') t.state = t.incidentId ? 'Triaged' : 'Captured' })
  bump()
}
/** Triage tags into an existing incident (pass id) or a new one (pass null). Returns the incident id. */
export function triageTags(tagIds: string[], incidentId: string | null, by: string = ME_ID): string | undefined {
  const tags = TAGS.filter((t) => tagIds.includes(t.id))
  if (!tags.length) return
  let target = incidentId ? inc(incidentId) : undefined
  if (!target) {
    const t = tags[0]
    const n = Math.max(...INCIDENTS.map((i) => Number(i.id.slice(4)))) + 1
    const now = iso(simNowMs())
    target = {
      id: `INC-${n}`, title: `${t.type} on ${t.locationLabel}`, type: t.type, sev: t.proposedSev, sevProposed: true, status: 'Triaged', flags: [],
      vehicleIds: [...new Set(tags.map((x) => x.vehicleId))], driveIds: [...new Set(tags.map((x) => x.driveId))], tagIds: [], reporterId: t.operatorId,
      shiftId: shiftOf(simNowMs()), createdAt: now, updatedAt: now, notes: [], history: [], escalationIds: [],
    }
    INCIDENTS.unshift(target)
    createdByTriage.add(target.id)
    FOOTAGE.unshift({ id: `FR-${3300 + INCIDENTS.length}`, incidentId: target.id, driveId: target.driveIds[0], vehicleId: target.vehicleIds[0], segment: 'pending', sev: target.sev, status: 'Captured', flags: [], due: iso(simNowMs() + 24 * 3600_000), findings: [] })
  }
  tags.forEach((t) => { t.state = 'Triaged'; t.incidentId = target!.id; target!.tagIds.push(t.id) })
  touch(target.id, ev(by, 'triaged', `triaged ${tags.length} tag${tags.length > 1 ? 's' : ''} into this incident`, { status: target.status }))
  bump()
  return target.id
}

/* ---------- fix round 1 (D-NEW): mutations screens were missing ---------- */

/** Undo for assignOwner. Pass what the incident had before (`prev`) so Undo restores it; with no `prev` the incident becomes unowned and drops back to Triaged if it was Owned. */
export function unassignOwner(incidentId: string, prev: { ownerId?: string; status?: Status } = {}, by: string = ME_ID): void {
  const i = inc(incidentId); if (!i) return
  i.ownerId = prev.ownerId
  i.status = prev.status ?? (i.status === 'Owned' ? 'Triaged' : i.status)
  touch(i.id, ev(by, 'unassigned', prev.ownerId ? `owner restored to ${prev.ownerId}` : 'owner removed', { status: i.status }))
  bump()
}
/** Undo for triageTags. Tags return to Captured and leave the incident; an incident that triageTags created, and that has no tags left, is removed. */
export function untriageTags(tagIds: string[]): void {
  const touched = new Set<string>()
  TAGS.forEach((t) => {
    if (!tagIds.includes(t.id) || !t.incidentId) return
    touched.add(t.incidentId)
    const i = inc(t.incidentId); if (i) i.tagIds = i.tagIds.filter((x) => x !== t.id)
    t.state = 'Captured'; t.incidentId = undefined
  })
  touched.forEach((id) => {
    const i = inc(id)
    if (i && createdByTriage.has(id) && i.tagIds.length === 0) {
      INCIDENTS.splice(INCIDENTS.indexOf(i), 1)
      const f = FOOTAGE.findIndex((x) => x.incidentId === id); if (f >= 0) FOOTAGE.splice(f, 1)
      createdByTriage.delete(id)
    }
  })
  bump()
}
const createdByTriage = new Set<string>()

/** Raise a SEV-agnostic escalation for an incident: chain is the reporter, then the rota's first two on-call leads. Returns the new escalation id, or the existing active one's id (never two active for one incident). */
export function raiseEscalation(incidentId: string, by: string = ME_ID): string | undefined {
  const i = inc(incidentId); if (!i) return
  const existing = ESCALATIONS.find((e) => e.incidentId === incidentId && (e.state === 'Raised' || e.state === 'Timed out'))
  if (existing) return existing.id
  const rota = [...LEADS].sort((a, b) => a.rotaOrder - b.rotaOrder).filter((l) => l.onCall)
  const [first, second] = rota
  if (!first) return
  const now = iso(simNowMs())
  const n = Math.max(...ESCALATIONS.map((e) => Number(e.id.slice(4)))) + 1
  const chain: ChainLink[] = [
    { role: 'Raised by', personId: i.reporterId, personKind: 'operator', reachable: 'reachable', link: 'done', at: now },
    { role: 'Current owner', personId: first.id, personKind: 'lead', reachable: first.reachable, link: 'current' },
    ...(second ? [{ role: 'Backup (rota)' as const, personId: second.id, personKind: 'lead' as const, reachable: second.reachable, link: 'next' as const }] : []),
  ]
  const e: Escalation = {
    id: `ESC-${String(n).padStart(4, '0')}`, incidentId, raisedAt: now, state: 'Raised', chain, currentIndex: 1, timeoutSec: ESC_TIMEOUT_SEC,
    deadline: iso(simNowMs() + ESC_TIMEOUT_SEC * 1000), channel: 'Push + page', history: [],
  }
  const x = ev(by, 'escalated', `raised escalation ${e.id}`)
  e.history.push(x)
  ESCALATIONS.push(e); i.escalationIds.push(e.id)
  if (!i.flags.includes('Escalated')) i.flags.push('Escalated')
  touch(i.id, x)
  bump()
  return e.id
}
/** Add a comment to an incident's timeline (kind 'comment'). Empty text is ignored. Returns the event so the caller can scroll to it. */
export function addComment(incidentId: string, text: string, by: string = ME_ID): AuditEvent | undefined {
  const t = text.trim(); const i = inc(incidentId)
  if (!i || !t) return
  const x = ev(by, 'comment', t)
  i.notes.push(t); touch(i.id, x)
  bump()
  return x
}
/** Tick or untick one protocol step (see lib/protocol.ts). Ticks are stored on the escalation with their time and survive navigation. */
export function setProtocolStep(escalationId: string, stepId: string, on: boolean, by: string = ME_ID): void {
  const e = ESCALATIONS.find((x) => x.id === escalationId)
  if (!e || e.state === 'Handled') return
  const p = { ...(e.protocol ?? {}) }
  if (on) p[stepId] = iso(simNowMs()); else delete p[stepId]
  e.protocol = p
  const title = PROTOCOL_STEPS.find((s) => s.id === stepId)?.title ?? stepId
  const x = ev(by, 'protocol', `${on ? 'ticked' : 'unticked'}: ${title}`); e.history.push(x); touch(e.incidentId, x)
  bump()
}
/** ISO time per ticked step for this escalation. */
export const getProtocol = (escalationId: string): Record<string, string> => ESCALATIONS.find((x) => x.id === escalationId)?.protocol ?? {}
/** Mark an escalation Handled. Requires Acknowledged and all protocol steps ticked; returns false (and does nothing) otherwise. */
export function resolveEscalation(escalationId: string, by: string = ME_ID): boolean {
  const e = ESCALATIONS.find((x) => x.id === escalationId)
  if (!e || e.state !== 'Acknowledged') return false
  if (!PROTOCOL_STEPS.every((s) => e.protocol?.[s.id])) return false
  e.state = 'Handled'; e.handledAt = iso(simNowMs())
  const x = ev(by, 'handled', 'marked escalation handled'); e.history.push(x); touch(e.incidentId, x)
  const i = inc(e.incidentId); if (i) i.flags = i.flags.filter((f) => f !== 'Escalated')
  bump()
  return true
}
/** Demo preload: Acknowledged by me, first two protocol steps ticked, timer stopped. Mutates silently (no bump) so it can run before the first render. Idempotent. */
export function applyDemoAcked(escalationId: string, by: string = ME_ID): void {
  const e = ESCALATIONS.find((x) => x.id === escalationId)
  if (!e || e.state === 'Handled') return
  const t = simNowMs()
  if (e.state === 'Raised' || e.state === 'Timed out') {
    e.state = 'Acknowledged'; e.ackAt = iso(t - 45_000); e.ackBy = by; e.deadline = undefined
    e.chain[e.currentIndex].link = 'done'
    e.history.push(ev(by, 'ack', 'acknowledged', { at: e.ackAt }))
  }
  if (!e.protocol || Object.keys(e.protocol).length === 0) e.protocol = { [PROTOCOL_STEPS[0].id]: iso(t - 30_000), [PROTOCOL_STEPS[1].id]: iso(t - 10_000) }
}
