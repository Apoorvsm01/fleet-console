import { applyDemoAcked } from './store'

const done = new Set<string>()
/**
 * Demo states for screenshots. `/escalations/ESC-0206?demo=acked` preloads: acknowledged by the signed-in lead, 2 of 5 protocol steps ticked, countdown stopped.
 * Called by AppShell during render, before the screen reads the store, so there is no flash of the un-acknowledged state. Runs once per escalation per page load.
 */
export function applyDemoFromLocation(pathname: string, search: string): void {
  const m = pathname.match(/^\/escalations\/([^/]+)/)
  if (!m) return
  if (new URLSearchParams(search).get('demo') !== 'acked') return
  if (done.has(m[1])) return
  done.add(m[1])
  applyDemoAcked(m[1])
}
