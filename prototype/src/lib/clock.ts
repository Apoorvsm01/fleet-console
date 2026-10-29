import { useEffect, useState } from 'react'
import { FIXTURE_NOW_MS } from './time'

const t0 = Date.now()
/** Simulated "now" in ms: fixture time plus real time elapsed since page load. Escalation countdowns run off this. */
export const simNowMs = (): number => FIXTURE_NOW_MS + (Date.now() - t0)

/** Re-renders every `intervalMs` (default 1 s) and returns simulated now in ms. Use sparingly: one ticking component per region. */
export function useSimNow(intervalMs = 1000): number {
  const [now, setNow] = useState(simNowMs)
  useEffect(() => {
    const id = window.setInterval(() => setNow(simNowMs()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
