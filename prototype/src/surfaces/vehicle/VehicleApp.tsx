// In-vehicle co-pilot surface. 1680x720, night default, 2-second glance standard (pipeline/surfaces.md section 3).
// Routes: /vehicle (drive + TagPad), /vehicle/hazard (GlanceAlert over the pad), /vehicle/emergency (SEV1 call).
// Query: ?mode=day, ?frame=0 (bare screen), ?dist=420 (hazard start), ?hold=1 (freeze distance), ?call=connected, ?esc=ESC-0206.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import './vehicle.css'
import { SEV_META } from '../../components'
import { DRIVES, ROUTES } from '../../data/fixtures'
import type { Sev, TagType } from '../../data/types'
import { PROTOCOL_STEPS } from '../../lib/protocol'
import { getEscalation } from '../../lib/queries'
import { captureTag, getProtocol, proposedSevFor, removeTag, setProtocolStep, useStore } from '../../lib/store'
import { COPY } from '../../lib/copy'
import { useFitZoom } from '../../lib/embed'
import { SurfaceChrome } from '../../components/SurfaceSwitcher'

/* ---------- fixtures for the vehicle ---------- */
const DRIVE = DRIVES.find((d) => d.state === 'Active')!
const SPEED_KMH = 62
/** Fixed per fleet (admin configured), ordered by proposed severity, nearest the driver (LHD: left) first. Ties keep the configured order; never re-sorted by use. */
const PAD: { type: TagType; sev: Sev }[] = ([
  'Phantom brake', 'Planner freeze', 'Sensor drop', 'Lane drift', 'Other',
] as TagType[]).map((type) => ({ type, sev: proposedSevFor(type) }))
const DEBOUNCE_MS = 600
const mutedHazards = new Set<string>()

/* ---------- helpers ---------- */
const cssMs = (name: string, fallback: number): number => {
  const el = document.querySelector('[data-surface="vehicle"]')
  const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : ''
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}
const speak = (text: string) => {
  try { if ('speechSynthesis' in window && !navigator.webdriver) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)) } } catch { /* no voice */ }
}

/** Shape + text + fill weight; never hue alone. Glyph 48, label 32, chip 56 (tokens). */
function VSev({ sev }: { sev: Sev }) {
  const label = SEV_META[sev].label
  return (
    <span className="v-chip" data-sev={sev}>
      <svg viewBox="0 0 12 12" aria-hidden>
        {sev === 3 ? <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /> : <path d={SEV_META[sev].glyph} fill="currentColor" />}
      </svg>
      <span>{label}</span>
    </span>
  )
}

/* ---------- Frame: bezel on a dark canvas, or bare ---------- */
function Frame({ bare, children }: { bare: boolean; children: ReactNode }) {
  const ref = useFitZoom<HTMLDivElement>(!bare, [], true)
  if (bare) return <div className="v-canvas" data-bare>{children}</div>
  return <div className="v-canvas"><div ref={ref} className="v-bezel">{children}</div></div>
}

/* ---------- Drive view ---------- */
function Strip() {
  return (
    <div className="v-strip">
      <span className="v-speed mono">{SPEED_KMH}</span><span>km/h</span>
      <span className="v-sep" />
      <span className="v-mode">Autonomy on</span>
      <span className="v-grow" />
      <span className="mono">{DRIVE.id}</span>
    </div>
  )
}

interface Toast { id: string; type: TagType; tagId: string }

function TagPad({ onTag, disabled }: { onTag: (type: TagType) => void; disabled?: boolean }) {
  return (
    <div className="v-pad" data-n={PAD.length} role="group" aria-label="Tag an issue">
      {PAD.map((k) => (
        <button key={k.type} type="button" className="v-key" data-sev={k.sev} disabled={disabled} onClick={() => onTag(k.type)} aria-label={`${k.type}, proposed SEV${k.sev}`}>
          <VSev sev={k.sev} />
          <span className="v-label">{k.type}</span>
        </button>
      ))}
    </div>
  )
}

function HazardBand({ dist, start, onMute }: { dist: number; start: number; onMute: () => void }) {
  const pct = Math.max(0, Math.min(100, (dist / start) * 100))
  return (
    <div className="v-band" role="alert" aria-label={`Debris in right lane, ${dist} metres`}>
      <span className="v-hazard" aria-hidden />
      <h1>Debris in right lane</h1>
      <div className="v-dist">
        <div className="v-bar" role="img" aria-label={`${dist} metres remaining`}><span style={{ width: `${pct}%` }} /></div>
        <span className="v-num mono">{dist}<small>m</small></span>
      </div>
      <button type="button" className="v-btn" onClick={onMute}>Got it</button>
    </div>
  )
}

function DriveView({ hazard }: { hazard?: boolean }) {
  useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [toast, setToast] = useState<Toast | null>(null)
  const last = useRef(-Infinity)
  const hideTimer = useRef<number>(0)

  // Hazard: distance counts down; at 0 m it is removed instantly.
  const start = Number(sp.get('dist')) || 420
  const [dist, setDist] = useState(start)
  const hold = sp.get('hold') === '1'
  useEffect(() => {
    if (!hazard || hold) return
    const t = window.setInterval(() => setDist((d) => Math.max(0, d - Math.round(SPEED_KMH / 3.6))), 1000)
    return () => window.clearInterval(t)
  }, [hazard, hold])
  const hazardOn = hazard && !mutedHazards.has('debris') && dist > 0
  useEffect(() => { if (hazard && (dist <= 0 || mutedHazards.has('debris'))) nav('/vehicle' + (sp.toString() ? `?${sp}` : ''), { replace: true }) }, [hazard, dist, nav, sp])

  const tag = useCallback((type: TagType) => {
    const now = performance.now()
    if (now - last.current < DEBOUNCE_MS) return
    last.current = now
    const route = ROUTES.find((r) => r.id === DRIVE.routeId)
    const t = captureTag({
      type, driveId: DRIVE.id, vehicleId: DRIVE.vehicleId, operatorId: DRIVE.operatorId, shiftId: 'PM',
      locationLabel: route ? route.name.split(' (')[0] : 'On route',
    })
    window.clearTimeout(hideTimer.current)
    setToast({ id: t.id, type, tagId: t.id })
    speak(`${type} logged`)
    hideTimer.current = window.setTimeout(() => setToast(null), cssMs('--duration-toast', 3000))
  }, [])
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  const undo = () => {
    if (!toast) return
    removeTag(toast.tagId)
    window.clearTimeout(hideTimer.current)
    setToast(null)
  }

  return (
    <>
      <Strip />
      <div className="v-zone" aria-live="polite">
        {hazardOn ? (
          <HazardBand dist={dist} start={start} onMute={() => { mutedHazards.add('debris'); nav('/vehicle') }} />
        ) : toast ? (
          <div className="v-toast" key={toast.id} role="status">
            <span className="v-logged">Logged · {toast.type}</span>
            <button type="button" className="v-btn v-undo" data-primary onClick={undo}>Undo</button>
          </div>
        ) : (
          <span className="v-hint">Say “Tag phantom brake”</span>
        )}
      </div>
      <TagPad onTag={tag} />
    </>
  )
}

/* ---------- SEV1 emergency call ----------
 * The shared protocol has 5 steps (lib/protocol.ts). The car guides the operator through 4 and maps them 1:1:
 * safe -> safe, vehicle safe -> location, emergency services -> emergency, preserve data -> preserve.
 * Step 5 ('notify', tell the next responder) belongs to the lead, not the operator, so the car NEVER ticks it.
 * The lead completes it on desktop; the car's final screen says so. */
type Answer = { label: string; value: 'yes' | 'no' | 'done'; primary?: boolean }
const YES_NO: Answer[] = [{ label: 'Yes', value: 'yes', primary: true }, { label: 'No', value: 'no' }]
const CALL_STEPS: { text: string; protocolId: (typeof PROTOCOL_STEPS)[number]['id']; answers: Answer[] }[] = [
  { text: 'Are you safe?', protocolId: 'safe', answers: YES_NO },
  { text: 'Park. Hazards on.', protocolId: 'location', answers: [{ label: 'Done', value: 'done', primary: true }] },
  { text: 'Emergency services needed?', protocolId: 'emergency', answers: [{ label: 'Yes, call', value: 'yes', primary: true }, { label: 'No', value: 'no' }] },
  { text: 'Keep recording on.', protocolId: 'preserve', answers: [{ label: 'Done', value: 'done', primary: true }] },
]
const CONNECT_AFTER_S = 4

interface Recognition { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null }

function EmergencyCall() {
  useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const escId = sp.get('esc') ?? 'ESC-0206'
  const view = getEscalation(escId)
  const protocol = view ? getProtocol(view.escalation.id) : {}
  const firstOpen = CALL_STEPS.findIndex((s) => !protocol[s.protocolId])
  const [idx, setIdx] = useState(firstOpen < 0 ? CALL_STEPS.length : firstOpen)
  const [help, setHelp] = useState(false)
  const [secs, setSecs] = useState(0)
  const forced = sp.get('call')
  const connected = forced ? forced === 'connected' : secs >= CONNECT_AFTER_S
  const done = idx >= CALL_STEPS.length
  const step = done ? undefined : CALL_STEPS[idx]

  // The clock really runs: pre-connect it counts down to the connection, then the call timer counts up from connect.
  useEffect(() => { const t = window.setInterval(() => setSecs((s) => s + 1), 1000); return () => window.clearInterval(t) }, [])

  const answer = useCallback((value: Answer['value']) => {
    if (!view || idx >= CALL_STEPS.length) return
    const st = CALL_STEPS[idx]
    if (st.protocolId === 'safe' && value === 'no') { setHelp(true); return }
    setProtocolStep(view.escalation.id, st.protocolId, true)
    setIdx(idx + 1)
  }, [view, idx])
  const answerRef = useRef(answer)
  useEffect(() => { answerRef.current = answer }, [answer])
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step }, [step])

  // Voice: read the step aloud, listen for the answer. Keys: Enter / Space (wheel controller) press the focused key.
  useEffect(() => { speak(help ? "Stay put. Help's coming." : done ? 'Steps logged.' : CALL_STEPS[idx].text) }, [idx, done, help])
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    // In the car, voice is always on. In the public prototype it's opt-in (?voice=1) so visitors don't get a mic prompt on load.
    const optedIn = new URLSearchParams(window.location.search).get('voice') === '1'
    if (!Ctor || navigator.webdriver || !optedIn) return
    let stopped = false
    const r = new Ctor(); r.continuous = true; r.interimResults = false; r.lang = 'en-US'
    r.onresult = (e) => {
      const last = e.results[e.results.length - 1][0].transcript
      const st = stepRef.current
      if (!st) return
      const m = /\b(yes|no|done)\b/i.exec(last)
      const v = m?.[1].toLowerCase() as Answer['value'] | undefined
      if (v && st.answers.some((a) => a.value === v)) answerRef.current(v)
    }
    r.onend = () => { if (!stopped) { try { r.start() } catch { /* already started */ } } }
    try { r.start() } catch { /* mic blocked */ }
    return () => { stopped = true; try { r.stop() } catch { /* ignore */ } }
  }, [])

  if (!view) return <Navigate to="/vehicle" replace />
  const end = () => nav('/vehicle')
  const name = view.current.name.split(' ')[0]
  const callSecs = forced ? secs : Math.max(0, secs - CONNECT_AFTER_S)
  const ringLeft = forced ? CONNECT_AFTER_S : Math.max(0, CONNECT_AFTER_S - secs)
  const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

  return (
    <div className="v-emerg" role="alertdialog" aria-label="SEV1 emergency call">
      <div className="v-left">
        <div className="v-sev1">
          <svg viewBox="0 0 12 12" aria-hidden><path d={SEV_META[1].glyph} fill="currentColor" /></svg>
          <span>SEV1</span>
        </div>
        {help ? (
          <>
            <p className="v-step" aria-live="assertive">Stay put. Help&apos;s coming.</p>
            <div className="v-answers"><button type="button" className="v-btn v-done" data-primary autoFocus onClick={() => setHelp(false)}>I&apos;m safe now</button></div>
          </>
        ) : done ? (
          <>
            <p className="v-step" aria-live="assertive">Steps logged.</p>
            <div className="v-answers"><button type="button" className="v-btn v-done" data-primary autoFocus onClick={end}>End call</button></div>
          </>
        ) : (
          <>
            <div aria-live="assertive">
              <div className="v-step-n mono">{idx + 1} of {CALL_STEPS.length}</div>
              <p className="v-step">{step!.text}</p>
            </div>
            <div className="v-answers" key={idx}>
              {step!.answers.map((a, i) => (
                <button key={a.value} type="button" className="v-btn v-done" data-primary={a.primary ? '' : undefined} autoFocus={i === 0} onClick={() => answer(a.value)}>{a.label}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="v-right">
        <div>
          <div className="v-lbl">{connected ? 'Connected' : 'Calling'}</div>
          <div className="v-who" aria-label={`${COPY.escalation.ownerLabel}: ${view.current.name}`}>{name}</div>
        </div>
        {connected
          ? <div className="v-timer mono" role="timer" aria-label="Call time">{clock(callSecs)}</div>
          : <div className="v-count mono" role="timer" aria-label="Connecting in">{clock(ringLeft)}</div>}
        {done ? <span /> : <button type="button" className="v-btn v-end" onClick={end}>End call</button>}
      </div>
    </div>
  )
}

/* ---------- App ---------- */
export default function VehicleApp() {
  const [sp] = useSearchParams()
  const day = sp.get('mode') === 'day'
  const bare = sp.get('frame') === '0'
  const app = (
    <div data-surface="vehicle" data-ambient={day ? 'day' : 'night'} className={bare ? undefined : 'h-full'}>
      <Frame bare={bare}>
        <main className="v-screen">
          <Routes>
            <Route index element={<DriveView />} />
            <Route path="hazard" element={<DriveView hazard />} />
            <Route path="emergency" element={<EmergencyCall />} />
            <Route path="*" element={<Navigate to="/vehicle" replace />} />
          </Routes>
        </main>
      </Frame>
    </div>
  )
  // The switcher bar sits outside the vehicle token scope so it stays at normal size.
  return bare ? app : <SurfaceChrome>{app}</SurfaceChrome>
}
