import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Icon, SeverityChip, StatusMarker, SeverityGlyph, sevMarkText } from '../../components'
import { COPY } from '../../lib/copy'
import { cx } from '../../lib/cx'
import { getIncident } from '../../lib/queries'
import { addComment, useStore } from '../../lib/store'
import { fmtRel, fmtTime } from '../../lib/time'
import { Divider, Group, Screen, Sheet, useIosToast } from './parts'

const drafts = new Map<string, string>() // draft survives dismiss
const EXCERPT = 5

export default function IncidentRead() {
  const { id = '' } = useParams()
  useStore()
  const toast = useIosToast()
  const [composer, setComposer] = useState(false)
  const [all, setAll] = useState(false)
  const d = getIncident(id)
  if (!d) return <Screen title="Incident" large={false} back={{ label: 'Inbox', to: 'inbox' }}><p className="px-pane pt-6 text-center text-base text-fg-muted">No incident {id}.</p></Screen>
  const i = d.incident
  const events = all ? d.timeline : d.timeline.slice(0, EXCERPT)
  const noteCount = i.notes.length
  return (
    <Screen title={i.id} large={false} anim="push" back={{ label: 'Back', to: 'inbox' }}
      footer={
        <div className="flex items-center justify-between gap-gap" role="toolbar" aria-label="Quick actions">
          <button type="button" onClick={() => toast(`Calling ${d.reporter?.name ?? 'operator'} (prototype: no call placed)`)} className="ios-press flex h-(--spacing-target) items-center gap-2 rounded-md px-pad text-base text-fg-link"><Icon name="phone" />Call</button>
          <button type="button" onClick={() => setComposer(true)} className="ios-press flex h-(--spacing-target) flex-1 items-center justify-center gap-2 rounded-md bg-accent px-pad text-base font-semibold text-fg-on-accent"><Icon name="plus" />Add note{drafts.get(i.id) ? ' (draft)' : ''}</button>
          <a href={`${import.meta.env.BASE_URL}incidents/${i.id}`} target="_blank" rel="noreferrer" className="ios-press flex h-(--spacing-target) items-center gap-2 rounded-md px-pad text-base text-fg-link"><Icon name="external" />Desktop</a>
        </div>
      }>
      <div className="flex flex-col gap-2 px-pane pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityChip sev={i.sev} proposed={i.sevProposed} />
          <StatusMarker status={i.status} flags={i.flags} variant="inline" />
        </div>
        <h2 className="text-lg font-semibold text-fg [overflow-wrap:anywhere]">{i.title}</h2>
        <p className="t-subhead text-fg-muted"><span className="font-mono text-sm">{i.id}</span> · {COPY.incident.ownerLabel}: {i.ownerId ? i.ownerName : COPY.unassigned}</p>
      </div>

      <Group title="What happened">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-gap gap-y-1.5 p-pad text-base">
          <dt className="text-fg-muted">Type</dt><dd className="text-fg">{i.type}</dd>
          <dt className="text-fg-muted">Reported</dt><dd className="text-fg">{d.reporter?.name ?? 'Unknown'}, {fmtRel(i.createdAt)}</dd>
          <dt className="text-fg-muted">Where</dt><dd className="text-fg [overflow-wrap:anywhere]">{d.tags[0]?.locationLabel ?? 'Location not reported'}</dd>
          <dt className="text-fg-muted">Tags</dt><dd className="text-fg">{i.tagCount}</dd>
        </dl>
      </Group>

      <Group title="Vehicles and drives">
        {d.vehicles.length === 0 && d.drives.length === 0 ? <p className="p-pad text-base text-fg-muted">None linked yet.</p> : (
          <ul>
            {d.vehicles.map((v, k) => (<li key={v.id}>{k > 0 && <Divider />}<div className="flex min-h-(--spacing-target) items-center gap-gap p-pad"><Icon name="car" className="text-fg-muted" /><span className="font-mono text-base text-fg">{v.id}</span><span className="min-w-0 flex-1 truncate text-base text-fg-muted">{v.nickname ?? ''}</span><span className="text-sm text-fg-muted">{v.status}</span></div></li>))}
            {d.drives.map((dr) => (<li key={dr.id}><Divider /><div className="flex min-h-(--spacing-target) items-center gap-gap p-pad"><Icon name="map" className="text-fg-muted" /><span className="font-mono text-base text-fg">{dr.id}</span></div></li>))}
          </ul>
        )}
      </Group>

      <Group title={`Timeline (${d.timeline.length})`}>
        {d.timeline.length === 0 ? <p className="p-pane text-base text-fg-muted">No events yet.</p> : (
          <ol>
            {events.map((ev, k) => (
              <li key={ev.id}>
                {k > 0 && <Divider />}
                <div className="flex min-h-(--spacing-target) items-start gap-gap p-pad">
                  <span className="mt-0.5 flex size-(--spacing-glyph) shrink-0 items-center justify-center">{ev.sev ? <span className={sevMarkText(ev.sev)}><SeverityGlyph sev={ev.sev} /></span> : <span className="size-1.5 rounded-full bg-status-off" />}</span>
                  <p className="min-w-0 flex-1 text-base text-fg [overflow-wrap:anywhere]"><span className="font-medium">{ev.actor}</span> {ev.verb}</p>
                  <time dateTime={ev.at} className="shrink-0 font-mono text-sm text-fg-muted">{fmtTime(ev.at)}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
        {d.timeline.length > EXCERPT && (<><Divider /><button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="ios-press h-(--spacing-target) w-full text-base text-fg-link">{all ? 'Show fewer' : `Show all ${d.timeline.length} events`}</button></>)}
      </Group>
      <p className={cx('px-pane pt-2 text-center text-sm text-fg-subtle')}>{noteCount} note{noteCount === 1 ? '' : 's'}. Severity and status are changed on desktop.</p>
      {composer && <Composer id={i.id} onClose={() => setComposer(false)} onSent={() => toast('Note added to the timeline')} />}
    </Screen>
  )
}

function Composer({ id, onClose, onSent }: { id: string; onClose: () => void; onSent: () => void }) {
  const [text, setText] = useState(drafts.get(id) ?? '')
  const set = (v: string) => { setText(v); drafts.set(id, v) }
  const send = () => { if (!text.trim()) return; addComment(id, text); drafts.delete(id); onSent(); onClose() }
  return (
    <Sheet title="New note" onClose={onClose} tall
      action={<button type="button" onClick={send} aria-disabled={!text.trim() || undefined} className={cx('ios-press h-(--spacing-target) rounded-md px-pad text-md font-semibold', text.trim() ? 'text-fg-link' : 'text-fg-disabled')}>Send</button>}>
      <div className="px-pane">
        <label htmlFor="note" className="sr-only">Note for {id}</label>
        <textarea id="note" data-autofocus value={text} onChange={(e) => set(e.target.value)} placeholder="What should the next person know?" rows={6}
          className="w-full resize-none rounded-lg bg-surface-sunken p-pad text-base text-fg placeholder:text-fg-subtle" />
        <p className="pt-2 text-sm text-fg-muted">Posts to the incident timeline with your name and the time. Your draft is kept if you cancel.</p>
      </div>
    </Sheet>
  )
}
