// Screenshot harness for the in-vehicle surface. Runs `vite` dev on port 5182 (not build/preview).
// Usage: node scripts/shoot-vehicle.mjs [--only drive-night,toast-night] [--url http://127.0.0.1:5182]
// Output: pipeline/screens/vehicle-<name>.png (1800x860 viewport @2x)
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const protoDir = resolve(here, '..')
const outDir = resolve(protoDir, '../pipeline/screens')
const PORT = 5182
const FONT_FLOOR = 32, TARGET_FLOOR = 76

const SHOTS = [
  { name: 'drive-night', route: '/vehicle' },
  { name: 'toast-night', route: '/vehicle', click: 'Phantom brake' },
  { name: 'hazard-night', route: '/vehicle/hazard?hold=1' },
  { name: 'emergency-calling', route: '/vehicle/emergency?call=calling' },
  { name: 'emergency-help', route: '/vehicle/emergency?call=calling', presses: ['No'] },
  { name: 'emergency-connected', route: '/vehicle/emergency?call=connected', presses: ['Yes', 'Done'] },
  { name: 'emergency-done', route: '/vehicle/emergency?call=connected', presses: ['Yes', 'Done', 'Yes, call', 'Done'] },
  { name: 'drive-day', route: '/vehicle?mode=day' },
  { name: 'toast-day', route: '/vehicle?mode=day', click: 'Sensor drop' },
  { name: 'hazard-day', route: '/vehicle/hazard?mode=day&hold=1' },
  { name: 'emergency-day', route: '/vehicle/emergency?mode=day&call=connected' },
  { name: 'drive-bare', route: '/vehicle?frame=0', bare: true },
]
const args = process.argv.slice(2)
const argValue = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }
const only = argValue('--only')?.split(',')
const shots = only ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  if (!existsSync(cache)) return undefined
  const dirs = readdirSync(cache).sort().reverse()
  return [
    ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')),
    ...dirs.filter((d) => d.startsWith('chromium-')).map((d) => join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')),
  ].find((p) => existsSync(p))
}
async function waitForHttp(url, ms = 30000) {
  const end = Date.now() + ms
  while (Date.now() < end) { try { if ((await fetch(url)).ok) return } catch { /* not up */ } await new Promise((r) => setTimeout(r, 250)) }
  throw new Error(`No response from ${url}`)
}

let server = null
let baseUrl = argValue('--url')
if (!baseUrl) {
  server = spawn(join(protoDir, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: protoDir, stdio: 'ignore' })
  baseUrl = `http://127.0.0.1:${PORT}`
}
try {
  await waitForHttp(baseUrl)
  const executablePath = findChromium()
  const browser = await chromium.launch({ headless: true, executablePath }).catch(() => chromium.launch({ headless: true }))
  mkdirSync(outDir, { recursive: true })
  for (const shot of shots) {
    const ctx = await browser.newContext({ viewport: { width: 1800, height: 860 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(baseUrl + shot.route, { waitUntil: 'networkidle' })
    if (shot.click) { await page.getByRole('button', { name: new RegExp(shot.click) }).click(); await page.waitForTimeout(300) }
    for (const label of shot.presses ?? []) { await page.getByRole('button', { name: new RegExp(`^${label}$`) }).click({ timeout: 5000 }); await page.waitForTimeout(100) }
    await page.waitForTimeout(300)
    const file = join(outDir, `vehicle-${shot.name}.png`)
    await page.screenshot({ path: file })
    // DOM measure (not by eye): smallest computed font-size of any visible text, smallest interactive target, vs the floors.
    await page.waitForSelector('[data-surface="vehicle"] button')
    const m = await page.evaluate(() => {
      let font = Infinity, fontEl = '', target = Infinity, targetEl = ''
      for (const el of document.querySelectorAll('[data-surface="vehicle"] *')) {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (own) { const f = parseFloat(getComputedStyle(el).fontSize); if (f < font) { font = f; fontEl = el.textContent.trim().slice(0, 24) } }
        if (el.matches('button, a, [role=button], input')) { const t = Math.min(r.width, r.height); if (t < target) { target = t; targetEl = el.textContent.trim().slice(0, 24) } }
      }
      return { font, fontEl, target, targetEl }
    })
    const bad = m.font < FONT_FLOOR || m.target < TARGET_FLOOR
    if (bad) process.exitCode = 1
    console.log(`saved ${file}${errors.length ? '  ERRORS: ' + errors.join(' | ') : ''}\n  min font ${m.font}px ("${m.fontEl}")  min target ${Math.round(m.target)}px ("${m.targetEl}")  ${bad ? 'FAIL' : 'ok'}`)
    await ctx.close()
  }
  await browser.close()
} catch (e) {
  console.error(e.message); process.exitCode = 1
} finally {
  server?.kill('SIGTERM')
}
