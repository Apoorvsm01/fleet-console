import { useMemo, useRef, useState } from 'react'
import type { MapMarker, Route } from '../data/types'
import { getRoutes } from '../lib/queries'
import { cx } from '../lib/cx'
import { SeverityChip } from './SeverityChip'
import { Kbd } from './ui'

type Layer = 'tag' | 'hazard' | 'vehicle'
const LAYERS: { key: Layer; label: string }[] = [{ key: 'tag', label: 'Tags and incidents' }, { key: 'hazard', label: 'Hazards' }, { key: 'vehicle', label: 'Vehicles' }]

export interface RouteMapProps {
  /** From getMapMarkers(). Positions are 0-100 schematic coordinates. */
  markers: MapMarker[]
  routes?: Route[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Id to highlight without selecting (timeline hover). */
  highlightId?: string | null
  /** Hide the layer panel (inline mini-map on Incident). */
  compactChrome?: boolean
  /** Sizing class for the frame, default aspect-3/2. */
  className?: string
  ariaLabel?: string
}

function MarkerShape({ m }: { m: MapMarker }) {
  if (m.kind === 'tag' || m.kind === 'incident') return <SeverityChip sev={m.sev ?? 3} proposed={m.proposed} dot />
  if (m.kind === 'hazard') {
    const st = m.hazardState
    return <span aria-hidden className={cx('block size-3.5 border-2 border-fg-muted', st === 'Active' && 'bg-fg-muted', st === 'Mitigated' && 'border-dotted', st === 'Stale' && 'border-dashed opacity-50')} />
  }
  return (
    <span className="flex flex-col items-center">
      <svg viewBox="0 0 12 12" className="size-3.5 text-accent" style={{ transform: `rotate(${(m.heading ?? 0) + 90}deg)` }} aria-hidden><path d="M6 1 10.5 11 6 8.5 1.5 11Z" fill="currentColor" /></svg>
      <span className="mono rounded-xs bg-surface px-px text-xs text-fg">{m.id}</span>
    </span>
  )
}

/**
 * Stylized SVG route schematic (not a real map). Markers are real buttons: Tab cycles by severity, Enter selects, Esc deselects,
 * arrows pan, +/- zoom, l toggles the layer panel. Hazards = neutral squares (solid Active, dotted Mitigated, faded Stale). Every marker should also appear in a table (accessible alternative).
 */
export function RouteMap({ markers, routes, selectedId, onSelect, highlightId, compactChrome, className, ariaLabel = 'Route map' }: RouteMapProps) {
  const rts = routes ?? getRoutes()
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ tag: true, hazard: true, vehicle: true })
  const [panel, setPanel] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<[number, number]>([0, 0])
  const frame = useRef<HTMLDivElement>(null)
  const shown = useMemo(() => markers.filter((m) => layers[m.kind === 'incident' ? 'tag' : m.kind]).sort((a, b) => (a.sev ?? 9) - (b.sev ?? 9)), [markers, layers])
  const sel = markers.find((m) => m.id === selectedId)

  const onKey = (e: React.KeyboardEvent) => {
    const step = 8 / zoom
    if (e.key === 'Escape') onSelect?.(null)
    else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(3, z + 0.5))
    else if (e.key === '-') setZoom((z) => Math.max(1, z - 0.5))
    else if (e.key === 'l') setPanel((p) => !p)
    else if (e.target === e.currentTarget && e.key.startsWith('Arrow')) {
      e.preventDefault()
      setPan(([x, y]) => [x + (e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0), y + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0)])
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <div ref={frame} role="application" aria-label={`${ariaLabel}. Tab through markers; arrows pan; plus and minus zoom.`} tabIndex={0} onKeyDown={onKey}
        className={cx('relative aspect-3/2 overflow-hidden rounded-md border border-line bg-surface-sunken', className)}>
        <div className="absolute inset-0" style={{ transform: `scale(${zoom}) translate(${pan[0]}%, ${pan[1]}%)`, transformOrigin: 'center' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            {[20, 40, 60, 80].map((v) => <g key={v}><line x1={v} y1="0" x2={v} y2="100" className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" /><line x1="0" y1={v} x2="100" y2={v} className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" /></g>)}
            <rect x="2" y="2" width="14" height="10" className="fill-surface stroke-line" vectorEffect="non-scaling-stroke" />
            <rect x="42" y="44" width="16" height="12" className="fill-surface stroke-line" vectorEffect="non-scaling-stroke" />
            <rect x="72" y="70" width="22" height="14" className="fill-surface stroke-line" vectorEffect="non-scaling-stroke" />
            {rts.map((r) => <polyline key={r.id} points={r.points.map((p) => p.join(',')).join(' ')} fill="none" className="stroke-fg-subtle" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
          </svg>
          {shown.map((m) => (
            <button key={m.id} type="button" onClick={(e) => { e.stopPropagation(); onSelect?.(m.id) }} title={m.label} aria-label={m.label} aria-pressed={m.id === selectedId}
              style={{ left: `${m.x}%`, top: `${m.y}%`, transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
              className={cx('absolute rounded-sm bg-surface/80 p-px', m.id === selectedId && 'outline-2 outline-focus', m.id === highlightId && m.id !== selectedId && 'outline-2 outline-line-strong')}>
              <MarkerShape m={m} />
            </button>
          ))}
        </div>
        <div className="absolute right-2 bottom-2 left-2 flex items-end justify-between gap-gap text-xs text-fg-muted">
          <ul className="pointer-events-none flex flex-wrap items-center gap-2 rounded-sm bg-surface/90 px-2 py-1" aria-label="Legend">
            <li className="flex items-center gap-1"><SeverityChip sev={1} dot />SEV1</li><li className="flex items-center gap-1"><SeverityChip sev={2} dot />SEV2</li>
            <li className="flex items-center gap-1"><SeverityChip sev={3} dot />SEV3</li>
            <li className="flex items-center gap-1"><span className="size-3 bg-fg-muted" aria-hidden />Hazard (solid active, dotted mitigated, faded stale)</li>
          </ul>
          {!compactChrome && <button type="button" onClick={() => setPanel((p) => !p)} aria-expanded={panel} className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-sm text-fg">Layers <Kbd>l</Kbd></button>}
        </div>
        {panel && !compactChrome && (
          <fieldset className="absolute top-2 right-2 rounded-md bg-surface-raised p-pad shadow-2">
            <legend className="sr-only">Layers</legend>
            {LAYERS.map((l) => (
              <label key={l.key} className="flex items-center gap-2 text-base text-fg"><input type="checkbox" className="accent-accent" checked={layers[l.key]} onChange={(e) => setLayers({ ...layers, [l.key]: e.target.checked })} />{l.label}</label>
            ))}
          </fieldset>
        )}
      </div>
      <p className="min-h-5 text-sm text-fg-muted" aria-live="polite">{sel ? `Selected: ${sel.label}` : `${shown.length} markers shown`}</p>
    </div>
  )
}
