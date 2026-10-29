import { useEffect, useRef } from 'react'
import { useApp } from '../lib/app'
import { ALL_KEYS, type KeyDef } from '../lib/keys'
import { Icon } from './Icon'
import { IconButton, KeyCombo } from './ui'

const GROUPS: KeyDef['group'][] = ['Global', 'Go to', 'List', 'Verbs']

/** The `?` overlay. Built from lib/keys.ts: if a key is not in the map it is not here, and vice versa. Mounted once by AppShell. */
export function KeyboardSheet() {
  const { helpOpen, setHelpOpen } = useApp()
  const closeBtn = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (helpOpen) { returnTo.current = document.activeElement as HTMLElement; window.setTimeout(() => closeBtn.current?.focus(), 0) }
    else returnTo.current?.focus?.()
  }, [helpOpen])
  if (!helpOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-scrim pt-24 anim-fade" onMouseDown={(e) => { if (e.target === e.currentTarget) setHelpOpen(false) }}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); setHelpOpen(false) }
        // keep Tab inside the sheet: the only tabbable control is the close button
        if (e.key === 'Tab') { e.preventDefault(); closeBtn.current?.focus() }
      }} className="flex max-h-[calc(100vh-var(--spacing)*32)] w-sheet flex-col overflow-hidden rounded-lg bg-surface-raised shadow-3">
        <div className="flex items-center gap-2 border-b border-line px-pad py-2">
          <Icon name="keyboard" className="text-fg-muted" />
          <h2 className="flex-1 text-md font-medium text-fg">Keyboard shortcuts</h2>
          <IconButton ref={closeBtn} label="Close shortcuts" onClick={() => setHelpOpen(false)}><Icon name="x" /></IconButton>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-pane gap-y-gap overflow-auto p-pane">
          {GROUPS.map((g) => (
            <section key={g} aria-label={g}>
              <h3 className="caps pb-1 text-fg-subtle">{g}</h3>
              <dl className="flex flex-col">
                {ALL_KEYS.filter((k) => k.group === g).map((k) => (
                  <div key={k.label + k.keys.join('')} className="flex min-h-row items-center gap-gap border-b border-line py-1">
                    <dt className="min-w-0 flex-1 text-base text-fg">{k.label}{k.note && <span className="block text-sm text-fg-subtle">{k.note}</span>}</dt>
                    <dd className="shrink-0"><KeyCombo keys={k.keys} /></dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <p className="border-t border-line px-pad py-2 text-sm text-fg-subtle">Shortcuts are ignored while you type in a field. Press ? or Esc to close.</p>
      </div>
    </div>
  )
}
