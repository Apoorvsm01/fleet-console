import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { useApp } from '../lib/app'
import type { Sev } from '../data/types'
import { Icon } from './Icon'
import { sevEdgeClass } from './SeverityChip'
import { Button, Kbd } from './ui'
import { ErrorState, LoadingState } from './states'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Column width in spacing units (1 = 4px, so 24 = 96px). Omit for a flexible column. */
  width?: number
  /** Flex weight for flexible columns (default 1). */
  flex?: number
  /** Floor for a flexible column, in spacing units. Default 0 (shrinks to the pane). */
  minWidth?: number
  /** Numbers, durations, counts: right-aligned. IDs and timestamps: use `mono`. */
  align?: 'left' | 'right'
  mono?: boolean
  /** Makes the header sortable. */
  sortValue?: (row: T) => string | number
}
export interface SortState { key: string; dir: 'asc' | 'desc' }
export interface BulkAction<T> {
  key: string // keyboard key, e.g. 'd'
  label: string
  /** Runs on the selected rows. Return an undo function to raise the 10 s undo toast. */
  run: (rows: T[]) => void | (() => void)
}
export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  ariaLabel: string
  /** Severity for the row edge bar (SEV1 4px, SEV2 3px, SEV3 none). */
  rowSev?: (row: T) => Sev | undefined
  /** Group rows (e.g. by SEV). Groups keep first-seen order; sort applies within groups. */
  groupBy?: (row: T) => { key: string; label: ReactNode }
  /** Controlled sort. If omitted, the table sorts internally by clicking headers. */
  sort?: SortState | null
  onSortChange?: (s: SortState | null) => void
  selectable?: boolean
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  /** Focused row (the one the detail pane follows). Controlled optionally. */
  activeKey?: string | null
  onActiveChange?: (key: string, row: T) => void
  /** Enter / click. `full` is true for Shift+Enter (open the full page). */
  onOpen?: (row: T, opts: { full: boolean }) => void
  bulkActions?: BulkAction<T>[]
  /** Called for e/a/s/d/v and other single keys on the selection (or the focused row). Return true if handled. */
  onKeyAction?: (key: string, rows: T[]) => boolean | void
  loading?: boolean
  error?: { title: string; detail?: ReactNode; onRetry?: () => void; refId?: string }
  /** Shown when there are no rows (pass an <EmptyState/>). */
  empty?: ReactNode
  /** Extra footer content (right side). */
  footer?: ReactNode
  rowClassName?: (row: T) => string | undefined
  /** Rows that arrived live and should fade a one-cycle highlight. They never reorder under the cursor. */
  highlightKeys?: Set<string>
  /** Fill parent height and scroll inside (default true). */
  className?: string
}

const track = (c: Column<unknown>) => (c.width ? `calc(var(--spacing) * ${c.width})` : `minmax(${c.minWidth ? `calc(var(--spacing) * ${c.minWidth})` : '0px'}, ${c.flex ?? 1}fr)`)
const SELECT_W = 'calc(var(--spacing) * 10)'

type Item<T> = { type: 'group'; key: string; label: ReactNode; count: number } | { type: 'row'; key: string; row: T }

/**
 * The workhorse table (Inbox, Review, Fleet, Owned). Roving tabindex: the grid is one tab stop.
 * Keys: j/k or arrows move, Enter open, Shift+Enter full page, x or Space select, Shift+j/k extend, Cmd/Ctrl+A select all, [ ] collapse/expand group,
 * Esc clears selection, and any bulkActions key (e.g. d) or onKeyAction key (e/a/s/v) acts on the selection or the focused row.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, rows, rowKey, ariaLabel, rowSev, groupBy, selectable, bulkActions, onKeyAction, onOpen, loading, error, empty, footer, rowClassName, highlightKeys, className } = props
  const { toast } = useApp()
  const [innerSort, setInnerSort] = useState<SortState | null>(null)
  const sort = props.sort !== undefined ? props.sort : innerSort
  const setSort = (s: SortState | null) => (props.onSortChange ? props.onSortChange(s) : setInnerSort(s))
  const [innerSel, setInnerSel] = useState<Set<string>>(new Set())
  const selected = props.selectedKeys ?? innerSel
  const setSelected = useCallback((s: Set<string>) => { if (props.onSelectionChange) props.onSelectionChange(s); else setInnerSel(s) }, [props])
  const [innerActive, setInnerActive] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const anchor = useRef<string | null>(null)
  const refs = useRef(new Map<string, HTMLElement>())
  const wantFocus = useRef(false)

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const sv = col.sortValue, d = sort!.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => { const x = sv(a), y = sv(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * d })
  }, [rows, sort, columns])

  const items = useMemo<Item<T>[]>(() => {
    if (!groupBy) return sorted.map((row) => ({ type: 'row', key: rowKey(row), row }))
    const order: string[] = [], map = new Map<string, { label: ReactNode; rows: T[] }>()
    sorted.forEach((r) => { const g = groupBy(r); if (!map.has(g.key)) { map.set(g.key, { label: g.label, rows: [] }); order.push(g.key) } map.get(g.key)!.rows.push(r) })
    return order.flatMap((k) => {
      const g = map.get(k)!
      return [{ type: 'group' as const, key: `g:${k}`, label: g.label, count: g.rows.length }, ...(collapsed.has(k) ? [] : g.rows.map((row) => ({ type: 'row' as const, key: rowKey(row), row })))]
    })
  }, [sorted, groupBy, rowKey, collapsed])
  const visible = useMemo(() => items.filter((i): i is Extract<Item<T>, { type: 'row' }> => i.type === 'row'), [items])
  const groupOf = useCallback((row: T) => groupBy?.(row).key, [groupBy])

  const activeKey = props.activeKey !== undefined ? props.activeKey : innerActive
  const effectiveActive = activeKey && visible.some((v) => v.key === activeKey) ? activeKey : visible[0]?.key ?? null
  const activate = useCallback((key: string, focus = false) => {
    setInnerActive(key); wantFocus.current = focus
    const r = visible.find((v) => v.key === key)
    if (r) props.onActiveChange?.(key, r.row)
  }, [visible, props])
  useEffect(() => {
    if (wantFocus.current && effectiveActive) { refs.current.get(effectiveActive)?.focus(); refs.current.get(effectiveActive)?.scrollIntoView({ block: 'nearest' }); wantFocus.current = false }
  })

  // Fixed-only tables keep their intrinsic width (scroll sideways); tables with a flexible column shrink to the pane.
  const fluid = columns.some((c) => !c.width)
  const cols = [selectable ? SELECT_W : null, ...columns.map((c) => track(c as Column<unknown>))].filter(Boolean).join(' ')
  const selRows = visible.filter((v) => selected.has(v.key)).map((v) => v.row)

  const toggle = (key: string) => { const n = new Set(selected); if (n.has(key)) n.delete(key); else n.add(key); setSelected(n); anchor.current = key }
  const extendTo = (key: string) => {
    const a = visible.findIndex((v) => v.key === (anchor.current ?? effectiveActive)), b = visible.findIndex((v) => v.key === key)
    if (a < 0 || b < 0) return
    const n = new Set(selected)
    visible.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((v) => n.add(v.key))
    setSelected(n)
  }
  const runBulk = (a: BulkAction<T>, target: T[]) => {
    if (!target.length) return
    const undo = a.run(target)
    toast({ message: `${a.label}: ${target.length} item${target.length > 1 ? 's' : ''}`, undo: typeof undo === 'function' ? undo : undefined })
    if (selected.size) setSelected(new Set())
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement
    const onRow = t.getAttribute('role') === 'row' || t === e.currentTarget
    if (!onRow && e.key !== 'Escape') return
    if (e.metaKey && e.key.toLowerCase() === 'a' && selectable) { e.preventDefault(); setSelected(new Set(visible.map((v) => v.key))); return }
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const idx = visible.findIndex((v) => v.key === effectiveActive)
    const move = (to: number) => {
      const n = visible[Math.max(0, Math.min(visible.length - 1, to))]
      if (!n) return
      e.preventDefault(); activate(n.key, true)
      if (e.shiftKey && selectable) extendTo(n.key)
    }
    const key = e.key
    const k = key.length === 1 ? key.toLowerCase() : key
    if (k === 'j' || key === 'ArrowDown') return move(idx + 1)
    if (k === 'k' || key === 'ArrowUp') return move(idx - 1)
    if (key === 'Home') return move(0)
    if (key === 'End') return move(visible.length - 1)
    const cur = visible[idx]
    if (key === 'Enter' && cur) { e.preventDefault(); onOpen?.(cur.row, { full: e.shiftKey }); return }
    if ((k === 'x' || key === ' ') && cur && selectable) { e.preventDefault(); toggle(cur.key); return }
    if (key === 'Escape') { if (selected.size) { e.stopPropagation(); setSelected(new Set()) } return }
    if ((key === '[' || key === ']') && cur && groupBy) {
      const g = groupOf(cur.row)!; const n = new Set(collapsed)
      if (key === '[') n.add(g); else n.delete(g)
      setCollapsed(n); return
    }
    const target = selRows.length ? selRows : cur ? [cur.row] : []
    const bulk = bulkActions?.find((b) => b.key === k)
    if (bulk && target.length) { e.preventDefault(); runBulk(bulk, target); return }
    if (onKeyAction && key.length === 1 && target.length && onKeyAction(k, target)) e.preventDefault()
  }

  const ariaSort = (c: Column<T>) => (sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined)
  const cell = 'min-w-0 px-pad py-0'
  return (
    <div className={cx('flex min-h-0 flex-1 flex-col bg-surface', className)}>
      <div role="grid" aria-label={ariaLabel} aria-rowcount={visible.length} aria-multiselectable={selectable || undefined} onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-auto">
        <div role="row" style={{ gridTemplateColumns: cols }} className={cx('sticky top-0 z-10 grid h-row items-center border-b border-line bg-surface-sunken shadow-1', !fluid && 'min-w-max')}>
          {selectable && (
            <div role="columnheader" className={cx(cell, 'flex items-center pl-4')}>
              <input type="checkbox" aria-label="Select all rows" className="size-4 accent-accent" checked={visible.length > 0 && selRows.length === visible.length}
                ref={(el) => { if (el) el.indeterminate = selRows.length > 0 && selRows.length < visible.length }}
                onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((v) => v.key)) : new Set())} />
            </div>
          )}
          {columns.map((c) => (
            <div key={c.key} role="columnheader" aria-sort={ariaSort(c)} className={cx(cell, 'caps text-fg-muted', c.align === 'right' && 'text-right')}>
              {c.sortValue ? (
                <button type="button" className={cx('inline-flex items-center gap-1 uppercase', c.align === 'right' && 'flex-row-reverse')}
                  onClick={() => setSort(sort?.key === c.key ? (sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' })}>
                  {c.header}
                  {sort?.key === c.key && <Icon name={sort.dir === 'asc' ? 'up' : 'down'} className="size-3" />}
                </button>
              ) : c.header}
            </div>
          ))}
        </div>
        {loading ? <LoadingState rows={8} label="Loading rows" />
          : error ? <div className="p-pane"><ErrorState {...error} inline /></div>
          : visible.length === 0 && items.length === 0 ? empty ?? null
          : items.map((it) => {
            if (it.type === 'group') {
              const gk = it.key.slice(2), closed = collapsed.has(gk)
              return (
                <div key={it.key} role="row" className={cx('flex h-row items-center border-b border-line bg-surface-sunken px-pad', !fluid && 'min-w-max')}>
                  <button type="button" aria-expanded={!closed} onClick={() => { const n = new Set(collapsed); if (closed) n.delete(gk); else n.add(gk); setCollapsed(n) }} className="inline-flex items-center gap-2 text-base font-medium text-fg">
                    <Icon name={closed ? 'right' : 'down'} className="size-3" />{it.label}<span className="text-sm font-normal text-fg-subtle">{it.count}</span>
                  </button>
                </div>
              )
            }
            const key = it.key, row = it.row, isSel = selected.has(key), isActive = key === effectiveActive
            return (
              <div key={key} role="row" id={`row-${key}`} aria-selected={selectable ? isSel : undefined} tabIndex={isActive ? 0 : -1}
                ref={(el) => { if (el) refs.current.set(key, el); else refs.current.delete(key) }}
                style={{ gridTemplateColumns: cols }}
                onFocus={(e) => { if (e.target === e.currentTarget && key !== innerActive) { setInnerActive(key); props.onActiveChange?.(key, row) } }}
                onClick={(e) => { if ((e.target as HTMLElement).closest('input,button,a')) return; activate(key, true); onOpen?.(row, { full: false }) }}
                className={cx('relative grid h-row scroll-mt-row items-center border-b border-line outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                  isSel ? 'bg-surface-selected' : 'hover:bg-surface-hover', highlightKeys?.has(key) && 'anim-highlight', !fluid && 'min-w-max', rowClassName?.(row))}>
                <span aria-hidden className={cx('absolute inset-y-0 left-0', sevEdgeClass(rowSev?.(row)))} />
                {isSel && <span aria-hidden className="absolute inset-y-0 left-edge-1 w-0.5 bg-accent" />}
                {selectable && (
                  <div role="gridcell" className={cx(cell, 'flex items-center pl-4')}>
                    <input type="checkbox" tabIndex={-1} aria-label={`Select ${key}`} className="size-4 accent-accent" checked={isSel} onChange={() => toggle(key)} />
                  </div>
                )}
                {columns.map((c) => (
                  <div key={c.key} role="gridcell" className={cx(cell, 'truncate', c.align === 'right' && 'text-right', c.mono && 'mono text-sm')}>{c.cell(row)}</div>
                ))}
              </div>
            )
          })}
      </div>
      {selRows.length > 0 && bulkActions && (
        <div role="toolbar" aria-label="Bulk actions" className="flex h-row shrink-0 items-center gap-2 border-t border-line-strong bg-surface-raised px-pad shadow-2">
          <span className="text-base font-medium text-fg">{selRows.length} selected</span>
          {bulkActions.map((b) => <Button key={b.key} variant="secondary" hint={b.key} onClick={() => runBulk(b, selRows)}>{b.label}</Button>)}
          <Button variant="ghost" className="ml-auto" hint="Esc" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}
      <div className="flex h-row shrink-0 items-center gap-gap border-t border-line bg-surface px-pad text-sm text-fg-subtle">
        <span aria-live="polite">{rows.length} {rows.length === 1 ? 'row' : 'rows'}{selRows.length ? `, ${selRows.length} selected` : ''}</span>
        <span className="hidden items-center gap-1 xl:inline-flex"><Kbd>j</Kbd><Kbd>k</Kbd> move <Kbd>Enter</Kbd> open{selectable && <><Kbd>x</Kbd> select</>}</span>
        <span className="ml-auto">{footer}</span>
      </div>
    </div>
  )
}
