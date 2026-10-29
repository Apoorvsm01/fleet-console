import { useEffect, useRef, useState } from 'react'
import type { Sev } from '../data/types'
import { cx } from '../lib/cx'

export const SEV_META: Record<Sev, { label: string; response: string; glyph: string }> = {
  1: { label: 'SEV1', response: 'Immediate; auto-escalates', glyph: "M6 1.5 11 10.5H1Z" },
  2: { label: 'SEV2', response: 'Same shift; owner required', glyph: "M6 1 11 6 6 11 1 6Z" },
  3: { label: 'SEV3', response: 'Batch review', glyph: '' },
}
/** Table row edge-bar classes: SEV1 4px, SEV2 3px, SEV3 none. Apply to an absolutely positioned span at the row's left. */
export const sevEdgeClass = (sev?: Sev): string =>
  sev === 1 ? 'w-edge-1 bg-sev1-mark' : sev === 2 ? 'w-edge-2 bg-sev2-mark' : 'hidden'
/** Text colour for a sev-coloured glyph on the neutral surface. */
export const sevMarkText = (sev: Sev): string => (sev === 1 ? 'text-sev1-mark' : sev === 2 ? 'text-sev2-mark' : 'text-sev3-mark')

/** The 12px severity glyph: filled triangle / filled diamond / ring. Inherits currentColor. */
export function SeverityGlyph({ sev, className }: { sev: Sev; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cx('size-3 shrink-0', className)} aria-hidden>
      {sev === 3 ? <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /> : <path d={SEV_META[sev].glyph} fill="currentColor" />}
    </svg>
  )
}

const FORM: Record<Sev, string> = {
  1: 'bg-sev1-mark text-on-sev1 border-on-sev1 font-semibold',
  2: 'bg-sev2-bg text-sev2-fg border-sev2-line font-semibold',
  3: 'bg-transparent text-sev3-fg border-sev3-line font-medium',
}

export interface SeverityChipProps {
  sev: Sev
  /** Auto-proposed (from a tag type), not yet confirmed by the lead: dashed border and "SEV2?". */
  proposed?: boolean
  /** Glyph only (maps and dense timelines). Keeps aria-label and tooltip. */
  dot?: boolean
  /** When set the chip becomes a picker (listbox; also `s` then 1/2/3 while focused). */
  onChange?: (sev: Sev) => void
  className?: string
}
/** The only way to show SEV1-3. Always text + glyph + fill weight + hue. Height follows density (22/18px). */
export function SeverityChip({ sev, proposed, dot, onChange, className }: SeverityChipProps) {
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false) // `s` pressed, waiting for 1/2/3
  const ref = useRef<HTMLSpanElement>(null)
  const meta = SEV_META[sev]
  const label = `${meta.label}${proposed ? '?' : ''}`
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  if (dot) {
    return (
      <span role="img" aria-label={label} title={`${label}: ${meta.response}`} className={cx('inline-flex size-4 items-center justify-center', sevMarkText(sev), className)}>
        <SeverityGlyph sev={sev} />
      </span>
    )
  }
  const body = (
    <>
      <SeverityGlyph sev={sev} />
      <span>{label}</span>
    </>
  )
  const cls = cx('inline-flex h-chip items-center gap-1 rounded-sm border px-2 text-sm leading-none whitespace-nowrap', FORM[sev], proposed ? 'border-dashed' : 'border-solid', sev === 1 && !proposed && 'border-transparent', className)
  if (!onChange) return <span className={cls} title={`${meta.label}: ${meta.response}`}>{body}</span>
  return (
    <span ref={ref} className="relative inline-flex">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} className={cls} title={`${meta.label}: ${meta.response} (s, then 1-3)`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (armed && ['1', '2', '3'].includes(e.key)) { onChange(Number(e.key) as Sev); setArmed(false); e.preventDefault(); return }
          setArmed(e.key === 's')
          if (e.key === 'Escape') setOpen(false)
        }}>
        {body}
      </button>
      {open && (
        <ul role="listbox" aria-label="Set severity" className="absolute top-full left-0 z-40 mt-1 w-max rounded-lg bg-surface-raised p-1 shadow-2">
          {([1, 2, 3] as Sev[]).map((s) => (
            <li key={s} role="option" aria-selected={s === sev} tabIndex={0} autoFocus={s === sev}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-hover"
              onClick={() => { onChange(s); setOpen(false) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onChange(s); setOpen(false) }
                if (e.key === 'Escape') setOpen(false)
                const sib = e.key === 'ArrowDown' ? e.currentTarget.nextElementSibling : e.key === 'ArrowUp' ? e.currentTarget.previousElementSibling : null
                if (sib) { (sib as HTMLElement).focus(); e.preventDefault() }
              }}>
              <span className={sevMarkText(s)}><SeverityGlyph sev={s} /></span>
              <span className="text-base text-fg">{SEV_META[s].label}</span>
              <span className="text-sm text-fg-subtle">{SEV_META[s].response.split('.')[1]?.trim()}</span>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
