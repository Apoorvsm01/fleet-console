import { useSearchParams } from 'react-router-dom'
import { COPY } from '../../lib/copy'
import { getCurrentUser, getShift } from '../../lib/queries'
import { fmtRel } from '../../lib/time'
import { Divider, Group, Screen, Segmented } from './parts'

export default function MeTab() {
  const [sp, setSp] = useSearchParams()
  const me = getCurrentUser()
  const shift = getShift(me.shiftId)
  const theme = (sp.get('theme') as 'light' | 'dark' | null) ?? 'auto'
  const setTheme = (t: 'auto' | 'light' | 'dark') => { const q = new URLSearchParams(sp); if (t === 'auto') q.delete('theme'); else q.set('theme', t); setSp(q, { replace: true }) }
  return (
    <Screen title="Me" tab="me">
      <Group>
        <div className="flex items-center gap-gap p-pad">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-md font-semibold text-accent-subtle-fg">{me.initials}</span>
          <div className="min-w-0">
            <p className="truncate text-md font-semibold text-fg">{me.name}</p>
            <p className="t-subhead text-fg-muted">{me.role} lead · {COPY.shiftName[shift.id]} shift · {COPY.reach[me.reachable]}</p>
          </div>
        </div>
      </Group>
      <Group title="Alerts">
        <div className="flex min-h-row items-center justify-between gap-gap p-pad"><span className="text-base text-fg">Critical Alerts (SEV1)</span><span className="text-base text-fg-muted">On</span></div>
        <Divider />
        <div className="flex min-h-row items-center justify-between gap-gap p-pad"><span className="text-base text-fg">Time Sensitive (SEV2)</span><span className="text-base text-fg-muted">On</span></div>
      </Group>
      <Group title="Appearance">
        <div className="p-pad"><Segmented label="Appearance" value={theme} onChange={setTheme} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
      </Group>
      <p className="px-pane pt-4 text-center text-sm text-fg-subtle">Last seen {fmtRel(me.lastSeen)}.</p>
    </Screen>
  )
}
