import { Fragment, useState } from 'react'
import { SeverityChip, StatusMarker } from '../../components'
import { getInbox } from '../../lib/queries'
import { useStore } from '../../lib/store'
import { fmtAge, ageMin } from '../../lib/time'
import { COPY } from '../../lib/copy'
import { cx } from '../../lib/cx'
import { sevEdgeClass } from '../../components'
import { Divider, Group, Screen, Segmented, useIosNav } from './parts'

export default function InboxTab() {
  useStore()
  const { go } = useIosNav()
  const [scope, setScope] = useState<'mine' | 'team'>('team')
  const rows = getInbox(scope)
  return (
    <Screen title="Inbox" tab="inbox" subtitle={`${rows.length} waiting. Read-only here; triage on desktop.`}>
      <div className="px-pane pt-1"><Segmented label="Scope" value={scope} onChange={setScope} options={[{ value: 'mine', label: 'Mine' }, { value: 'team', label: 'Team' }]} /></div>
      {rows.length === 0 ? <p className="px-pane pt-8 text-center text-base text-fg-muted">Nothing waiting. New tags and incidents show up here.</p> : (
        <Group>
          {rows.map((r, i) => {
            const body = (
              <>
                <span aria-hidden className={cx('absolute inset-y-0 left-0', sevEdgeClass(r.sev))} />
                <span className="mt-0.5"><SeverityChip sev={r.sev} proposed={r.proposed} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="line-clamp-2 text-md font-medium text-fg [overflow-wrap:anywhere]">{r.title}</span>
                  <span className="t-subhead text-fg-muted">{r.kind === 'tag' ? 'Untriaged tag' : <StatusMarker status={r.status} variant="inline" />} · <span className="font-mono text-sm">{r.vehicleId}</span> · {fmtAge(ageMin(r.createdAt))}</span>
                  <span className="text-sm text-fg-muted">{r.ownerId ? '' : COPY.unassigned}{r.tagCount > 1 ? `${r.ownerId ? '' : ' · '}${r.tagCount} tags` : ''}</span>
                </span>
              </>
            )
            return (
              <Fragment key={r.key}>
                {i > 0 && <Divider />}
                {r.incidentId ? (
                  <button type="button" onClick={() => go(`inc/${r.incidentId}`)} className="ios-press relative flex min-h-row w-full items-start gap-gap py-3 pr-pad pl-pad text-left">{body}</button>
                ) : (
                  <div className="relative flex min-h-row w-full items-start gap-gap py-3 pr-pad pl-pad">{body}</div>
                )}
              </Fragment>
            )
          })}
        </Group>
      )}
    </Screen>
  )
}
