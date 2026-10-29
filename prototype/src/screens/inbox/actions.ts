import { assignOwner, advanceStatus, dismissTags, setSeverity, triageTags, unassignOwner, untriageTags, undismissTags } from '../../lib/store'
import { getIncident, type InboxRow } from '../../lib/queries'
import type { Sev } from '../../data/types'

/** Tags have no severity or owner of their own: promote to an incident first (one incident per tag), then act. `created` collects tag ids promoted here so undo can reverse it. */
function ensureIncident(r: InboxRow, created: string[]): string | undefined {
  if (r.incidentId) return r.incidentId
  const id = triageTags([r.id], null)
  if (id) created.push(r.id)
  return id
}

export function applySeverity(rows: InboxRow[], sev: Sev): () => void {
  const created: string[] = []
  const prev: { id: string; sev: Sev }[] = []
  rows.forEach((r) => {
    const id = ensureIncident(r, created)
    if (!id) return
    prev.push({ id, sev: getIncident(id)?.incident.sev ?? sev })
    setSeverity(id, sev)
  })
  return () => { prev.forEach((p) => setSeverity(p.id, p.sev)); if (created.length) untriageTags(created) }
}

export function applyAssign(rows: InboxRow[], ownerId: string): () => void {
  const created: string[] = []
  const prev: { id: string; ownerId?: string; status?: ReturnType<typeof statusOf> }[] = []
  rows.forEach((r) => {
    const id = ensureIncident(r, created)
    if (!id) return
    const inc = getIncident(id)?.incident
    prev.push({ id, ownerId: inc?.ownerId, status: inc?.status })
    assignOwner(id, ownerId)
  })
  return () => {
    prev.forEach((p) => unassignOwner(p.id, { ownerId: p.ownerId, status: p.status }))
    if (created.length) untriageTags(created)
  }
}
const statusOf = (id: string) => getIncident(id)?.incident.status

export function applyTriage(rows: InboxRow[]): () => void {
  const tagIds: string[] = []
  const advanced: { id: string; ownerId?: string; status?: ReturnType<typeof statusOf> }[] = []
  rows.forEach((r) => {
    if (r.kind === 'tag') { if (triageTags([r.id], null)) tagIds.push(r.id) }
    else if (r.status === 'Captured') {
      const inc = getIncident(r.id)?.incident
      if (advanceStatus(r.id)) advanced.push({ id: r.id, ownerId: inc?.ownerId, status: inc?.status })
    }
  })
  return () => {
    if (tagIds.length) untriageTags(tagIds)
    advanced.forEach((p) => unassignOwner(p.id, { ownerId: p.ownerId, status: p.status }))
  }
}

export function applyDismiss(rows: InboxRow[]): () => void {
  const ids = rows.filter((r) => r.kind === 'tag').map((r) => r.id)
  if (ids.length) dismissTags(ids)
  return () => { if (ids.length) undismissTags(ids) }
}
