import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SavedView } from '../data/types'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import { Button, Kbd } from './ui'

export interface FilterField<T> {
  /** Token name, e.g. "sev" in `sev:1,2`. */
  key: string
  label: string
  /** Suggested values (also used to validate). Omit for free values. */
  values?: { value: string; label: string }[]
  /** True if the row matches ANY of the values (values are lowercased). */
  match: (row: T, values: string[]) => boolean
}
export interface FilterToken { raw: string; field?: string; values: string[]; negate: boolean; error?: string }

/** Parse `sev:1,2 -status:verified owner:none free text` into tokens. Words without a colon are free-text tokens. */
export function parseQuery<T>(query: string, fields: FilterField<T>[]): FilterToken[] {
  return query.trim().split(/\s+/).filter(Boolean).map((raw) => {
    const m = raw.match(/^(-?)([a-z]+):(.*)$/i)
    if (!m) return { raw, values: [raw.toLowerCase()], negate: false }
    const f = fields.find((x) => x.key === m[2].toLowerCase())
    const values = m[3].split(',').filter(Boolean).map((v) => v.toLowerCase())
    if (!f) return { raw, field: m[2], values, negate: !!m[1], error: `Unknown filter "${m[2]}". Try ${fields.map((x) => x.key).join(', ')}.` }
    if (!values.length) return { raw, field: f.key, values, negate: !!m[1], error: `"${f.key}" needs a value.` }
    return { raw, field: f.key, values, negate: !!m[1] }
  })
}
/** Apply a query to rows. `textOf` supplies the haystack for free-text words (all words must appear). Invalid tokens are ignored. */
export function filterRows<T>(rows: T[], query: string, fields: FilterField<T>[], textOf?: (r: T) => string): T[] {
  const toks = parseQuery(query, fields)
  if (!toks.length) return rows
  return rows.filter((r) => toks.every((t) => {
    if (t.error) return true
    if (!t.field) return (textOf?.(r) ?? '').toLowerCase().includes(t.values[0])
    const f = fields.find((x) => x.key === t.field)!
    const hit = f.match(r, t.values)
    return t.negate ? !hit : hit
  }))
}

export interface FilterBarProps<T> {
  fields: FilterField<T>[]
  /** Committed query string (usually from useQueryState('q')). */
  query: string
  onQueryChange: (q: string) => void
  views?: SavedView[]
  activeViewId?: string | null
  /** Called with a view id (apply it) or null (clear). The parent should set query to view.query. */
  onViewChange?: (id: string | null) => void
  /** Save current query over the active view (Cmd+S) or as new (name given). Never auto-saves over a shared view. */
  onSaveView?: (name?: string) => void
  placeholder?: string
  resultCount: number
  totalCount?: number
  loading?: boolean
  /** Simple-mode quick filters (Mine/Team etc.) rendered before the input. */
  quick?: ReactNode
  /** Right side controls: sort, group, density toggle. */
  trailing?: ReactNode
}

/** One input, one parser: simple quick filters for beginners, token query (`sev:1,2 owner:none`) for power users. `/` focuses it from anywhere; Backspace on empty removes the last token. */
export function FilterBar<T>({ fields, query, onQueryChange, views, activeViewId, onViewChange, onSaveView, placeholder = 'Filter: type a word or sev:1,2 owner:none', resultCount, totalCount, loading, quick, trailing }: FilterBarProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const [hi, setHi] = useState(0)
  const listId = useId()
  const tokens = useMemo(() => parseQuery(query, fields), [query, fields])
  const view = views?.find((v) => v.id === activeViewId)
  const modified = !!view && view.query.trim() !== query.trim()
  const errors = tokens.filter((t) => t.error)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement) && !t.isContentEditable) { e.preventDefault(); inputRef.current?.focus() }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && onSaveView && modified && view && !view.shared) { e.preventDefault(); onSaveView() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onSaveView, modified, view])

  const suggestions = useMemo(() => {
    if (!focused) return []
    const m = draft.match(/^(-?)([a-z]+):(.*)$/i)
    if (m) {
      const f = fields.find((x) => x.key === m[2].toLowerCase())
      const last = m[3].split(',').pop()!.toLowerCase()
      return (f?.values ?? []).filter((v) => v.value.toLowerCase().startsWith(last) || v.label.toLowerCase().startsWith(last)).map((v) => ({ text: `${m[1]}${f!.key}:${[...m[3].split(',').slice(0, -1), v.value].join(',')}`, label: `${f!.label}: ${v.label}`, commit: true }))
    }
    return fields.filter((f) => !draft || f.key.startsWith(draft.toLowerCase()) || f.label.toLowerCase().startsWith(draft.toLowerCase())).map((f) => ({ text: `${f.key}:`, label: `${f.label} (${f.key}:)`, commit: false }))
  }, [draft, fields, focused])

  const commit = (text: string) => { const t = text.trim(); if (t) onQueryChange(`${query.trim()} ${t}`.trim()); setDraft('') }
  const removeAt = (i: number) => onQueryChange(tokens.filter((_, k) => k !== i).map((t) => t.raw).join(' '))
  const accept = (s: { text: string; commit: boolean }) => { if (s.commit) commit(s.text); else setDraft(s.text); setHi(0) }

  return (
    <div className="flex flex-col gap-2 border-b border-line bg-surface px-pane py-2">
      {views && views.length > 0 && (
        <div role="tablist" aria-label="Saved views" className="flex flex-wrap items-center gap-1">
          {views.filter((v) => v.pinned || v.id === activeViewId).map((v) => (
            <button key={v.id} role="tab" type="button" aria-selected={v.id === activeViewId} onClick={() => onViewChange?.(v.id === activeViewId ? null : v.id)}
              className={cx('inline-flex h-ctl items-center gap-2 rounded-sm border px-pad text-base', v.id === activeViewId ? 'border-accent bg-accent-subtle text-accent-subtle-fg' : 'border-line text-fg-muted hover:bg-surface-hover')}>
              {v.name}{v.shared && <span className="text-xs text-fg-subtle">shared</span>}
              {v.id === activeViewId && modified && <span aria-label="modified" title="View modified" className="size-2 rounded-full bg-accent" />}
            </button>
          ))}
          {modified && view && (
            <>
              <Button variant="ghost" onClick={() => onSaveView?.()} disabled={view.shared} disabledReason="Shared view: use Save as new" hint="Cmd S">Save</Button>
              <Button variant="ghost" onClick={() => onViewChange?.(view.id)}>Revert</Button>
              <Button variant="ghost" onClick={() => { const n = window.prompt('Name for the new view'); if (n) onSaveView?.(n) }}>Save as new</Button>
            </>
          )}
          {!view && query.trim() && onSaveView && <Button variant="ghost" onClick={() => { const n = window.prompt('Name for the new view'); if (n) onSaveView(n) }}>Save as view</Button>}
        </div>
      )}
      <div className="flex items-center gap-gap">
        {quick}
        <div className="relative min-w-0 flex-1">
          <div className="flex min-h-ctl flex-wrap items-center gap-1 rounded-sm border border-line-strong bg-surface px-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus" onClick={() => inputRef.current?.focus()}>
            <Icon name="search" className="text-fg-subtle" />
            {tokens.map((t, i) => (
              <span key={i} title={t.error} className={cx('inline-flex h-chip items-center gap-1 rounded-sm bg-accent-subtle px-2 text-sm text-accent-subtle-fg', t.error && 'border border-dashed border-line-strong bg-surface-sunken text-fg')}>
                {t.field ? <><b className="font-semibold">{t.negate ? 'not ' : ''}{t.field}</b>{t.values.join(' or ')}</> : `"${t.raw}"`}
                <button type="button" aria-label={`Remove filter ${t.raw}`} onClick={(e) => { e.stopPropagation(); removeAt(i) }} className="rounded-xs hover:bg-surface-hover"><Icon name="x" className="size-3" /></button>
              </span>
            ))}
            <input ref={inputRef} role="combobox" aria-expanded={suggestions.length > 0} aria-controls={listId} aria-autocomplete="list" aria-label="Filter" value={draft} placeholder={tokens.length ? '' : placeholder}
              className="h-ctl min-w-32 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
              onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 100)}
              onChange={(e) => { const v = e.target.value; if (/\s$/.test(v)) commit(v); else setDraft(v); setHi(0) }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !draft && tokens.length) { removeAt(tokens.length - 1); return }
                if (e.key === 'Escape') { setDraft(''); inputRef.current?.blur(); return }
                if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, suggestions.length - 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
                if (e.key === 'Tab' && suggestions[hi] && draft) { e.preventDefault(); accept(suggestions[hi]) }
                if (e.key === 'Enter') { e.preventDefault(); if (suggestions[hi] && draft && /:$/.test(draft)) accept(suggestions[hi]); else commit(draft) }
              }} />
            {!draft && !tokens.length && <Kbd>/</Kbd>}
          </div>
          {suggestions.length > 0 && (
            <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-40 mt-1 max-h-64 overflow-auto rounded-lg bg-surface-raised p-1 shadow-2">
              {suggestions.map((s, i) => (
                <li key={s.text} role="option" aria-selected={i === hi} onMouseDown={(e) => { e.preventDefault(); accept(s) }}
                  className={cx('flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-base', i === hi ? 'bg-surface-selected' : 'hover:bg-surface-hover')}>
                  <span>{s.label}</span>{i === hi && <Kbd>Tab</Kbd>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <span aria-live="polite" className="shrink-0 text-sm whitespace-nowrap text-fg-muted">
          {loading ? '...' : totalCount != null && totalCount !== resultCount ? `${resultCount} of ${totalCount}` : `${resultCount} result${resultCount === 1 ? '' : 's'}`}
        </span>
        {query.trim() && <Button variant="ghost" onClick={() => onQueryChange('')}>Clear</Button>}
        {trailing}
      </div>
      {errors.length > 0 && <p role="status" className="text-sm text-fg-muted">{errors[0].error}</p>}
    </div>
  )
}
