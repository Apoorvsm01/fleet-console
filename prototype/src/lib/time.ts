import type { Iso, ShiftId } from '../data/types'

/** The fixture world is frozen at this instant (Thu 2026-10-29 15:42 UTC, PM shift active). All times display in UTC. */
export const FIXTURE_NOW_MS = Date.UTC(2026, 9, 29, 15, 42, 0)
export const FIXTURE_NOW: Iso = new Date(FIXTURE_NOW_MS).toISOString()
/** 24h coverage day axis starts here (AM shift start). */
export const DAY_START_MS = Date.UTC(2026, 9, 29, 6, 0, 0)
export const DAY_END_MS = DAY_START_MS + 24 * 3600_000

export const iso = (ms: number): Iso => new Date(ms).toISOString()
/** ISO timestamp `min` minutes before fixture now (negative = future). */
export const ago = (min: number): Iso => iso(FIXTURE_NOW_MS - min * 60_000)
export const ms = (t: Iso): number => Date.parse(t)
/** ISO timestamp at hh:mm UTC on the coverage day (use dayOffset 1 for after midnight). */
export const at = (h: number, m = 0, dayOffset = 0): Iso => iso(Date.UTC(2026, 9, 29 + dayOffset, h, m))

const pad = (n: number) => String(n).padStart(2, '0')
/** "15:42" */
export const fmtTime = (t: Iso | number): string => {
  const d = new Date(t)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
/** "Oct 29 15:42" */
export const fmtDateTime = (t: Iso | number): string => {
  const d = new Date(t)
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  return `${mon} ${d.getUTCDate()} ${fmtTime(t)}`
}
/** "Oct 29" */
export const fmtDay = (t: Iso | number): string => {
  const d = new Date(t)
  return `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}`
}
/** Relative to `now` (default fixture now): "3m", "2h 10m", "4d", "in 2h". Compact for table cells. */
export const fmtRel = (t: Iso | number, now: number = FIXTURE_NOW_MS): string => {
  const diff = now - (typeof t === 'number' ? t : Date.parse(t))
  const future = diff < 0
  const min = Math.round(Math.abs(diff) / 60_000)
  let s: string
  if (min < 1) s = 'now'
  else if (min < 60) s = `${min}m`
  else if (min < 48 * 60) s = `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`
  else s = `${Math.floor(min / 1440)}d`
  if (s === 'now') return s
  return future ? `in ${s}` : `${s} ago`
}
/** Age in minutes. */
export const ageMin = (t: Iso, now: number = FIXTURE_NOW_MS): number => Math.round((now - Date.parse(t)) / 60_000)
/** "04:12" for a countdown, clamped at 0. */
export const fmtCountdown = (remainingMs: number): string => {
  const s = Math.max(0, Math.ceil(remainingMs / 1000))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}
/** "2d", "5h", "40m" duration from minutes. */
export const fmtAge = (min: number): string => (min >= 2880 ? `${Math.floor(min / 1440)}d` : min >= 120 ? `${Math.floor(min / 60)}h` : `${min}m`)
/** "10,412" */
export const fmtNum = (n: number): string => n.toLocaleString('en-US')

/** Which shift owns an instant. AM 06-14, PM 14-22, GY 22-06. */
export const shiftOf = (t: Iso | number): ShiftId => {
  const h = new Date(t).getUTCHours()
  return h >= 6 && h < 14 ? 'AM' : h >= 14 && h < 22 ? 'PM' : 'GY'
}
