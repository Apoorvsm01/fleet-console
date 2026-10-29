import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { cx } from '../lib/cx'
import { Kbd } from './ui'

export interface SplitPaneHandle { focusList: () => void; focusDetail: () => void; toggleDetail: () => void }
export interface SplitPaneProps {
  list: ReactNode
  /** Detail content. When null/undefined, `emptyDetail` is shown (nothing selected). */
  detail?: ReactNode
  emptyDetail?: ReactNode
  /** Detail pane visible (default true). Controlled optionally. */
  detailOpen?: boolean
  onDetailOpenChange?: (open: boolean) => void
  /** Imperative handle: focusList() returns to the list at the same row; focusDetail() moves into the detail (wire to Enter in the table's onOpen). */
  apiRef?: Ref<SplitPaneHandle>
  /** Cap the detail pane at this width in spacing units (110 = 440px). Omit for the fluid default. */
  detailMax?: number
  listLabel: string
  detailLabel: string
  className?: string
}
const STEP = 16
/**
 * List left, preview right. Divider is draggable and keyboard resizable (Alt+Left/Right, 16 px steps). `\` toggles the detail; Esc in the detail returns focus to the list.
 * Fill the parent: give the parent a height (the AppShell main area does). Detail follows focus: debounce with useDwell(key, 120) from lib/useQueryState.
 */
export function SplitPane({ list, detail, emptyDetail, detailOpen: openProp, onDetailOpenChange, apiRef, detailMax, listLabel, detailLabel, className }: SplitPaneProps) {
  const [openInner, setOpenInner] = useState(true)
  const open = openProp ?? openInner
  const setOpen = useCallback((o: boolean) => { if (onDetailOpenChange) onDetailOpenChange(o); else setOpenInner(o) }, [onDetailOpenChange])
  const [listPx, setListPx] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const listEl = useRef<HTMLElement>(null)
  const detailEl = useRef<HTMLElement>(null)

  const focusList = useCallback(() => { (listEl.current?.querySelector('[role=row][tabindex="0"], [tabindex="0"]') as HTMLElement | null)?.focus() }, [])
  const focusDetail = useCallback(() => {
    const d = detailEl.current
    ;(d?.querySelector<HTMLElement>('button, a[href], input, [tabindex="0"]') ?? d)?.focus()
  }, [])
  useImperativeHandle(apiRef, () => ({ focusList, focusDetail, toggleDetail: () => setOpen(!open) }), [focusList, focusDetail, open, setOpen])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '\\' && root.current?.contains(t) && !(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(!open) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, setOpen])

  const drag = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const left = root.current!.getBoundingClientRect().left
    const move = (ev: PointerEvent) => setListPx(Math.max(0, ev.clientX - left))
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up)
  }
  const cols = !open ? 'minmax(0, 1fr)'
    : listPx != null ? `minmax(calc(var(--spacing) * 90), ${listPx}px) calc(var(--spacing) * 2) minmax(calc(var(--spacing) * 105), 1fr)`
    : detailMax ? `minmax(calc(var(--spacing) * 90), 1fr) calc(var(--spacing) * 2) minmax(calc(var(--spacing) * 90), calc(var(--spacing) * ${detailMax}))`
    : 'minmax(calc(var(--spacing) * 90), 1fr) calc(var(--spacing) * 2) minmax(calc(var(--spacing) * 105), 0.8fr)'

  return (
    <div ref={root} style={{ gridTemplateColumns: cols }} className={cx('grid min-h-0 flex-1 bg-canvas', className)}>
      <section ref={listEl} aria-label={listLabel} className="flex min-h-0 min-w-0 flex-col" data-pane="list">{list}</section>
      {open && (
        <>
          <div role="separator" aria-orientation="vertical" aria-label="Resize panes" tabIndex={0} aria-valuenow={listPx ?? undefined}
            onPointerDown={drag}
            onKeyDown={(e) => {
              if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
              e.preventDefault()
              const cur = listPx ?? listEl.current?.getBoundingClientRect().width ?? 0
              setListPx(Math.max(0, cur + (e.key === 'ArrowLeft' ? -STEP : STEP)))
            }}
            className="group flex cursor-col-resize justify-center">
            <span className="w-px bg-line group-hover:bg-line-strong group-focus-visible:bg-focus" />
          </div>
          <section ref={detailEl} aria-label={detailLabel} data-pane="detail" tabIndex={-1} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); focusList() } }}
            className="flex min-h-0 min-w-0 flex-col overflow-auto bg-surface outline-none">
            {detail ?? emptyDetail ?? <div className="p-pane text-base text-fg-muted">Nothing selected. Press <Kbd>j</Kbd> or <Kbd>k</Kbd> to move, <Kbd>Enter</Kbd> to preview.</div>}
          </section>
        </>
      )}
    </div>
  )
}
