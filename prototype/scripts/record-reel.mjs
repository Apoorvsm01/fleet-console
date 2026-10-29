// Records the portfolio motion reel of the Fleet Console prototype.
// Usage: node scripts/record-reel.mjs   (expects vite dev on :5185, starts it if absent)
// Output: portfolio public/work/fleet-console/reel.mp4 + reel.jpg
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Playwright wants its pinned ffmpeg build for recordVideo; if only an older cached one exists, expose it under the expected name.
{
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  const want = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../node_modules/playwright-core/browsers.json'), 'utf8')).browsers.find((b) => b.name === 'ffmpeg').revision
  const have = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith('ffmpeg-')) : []
  if (have.length && !have.includes(`ffmpeg-${want}`)) {
    const shim = join(tmpdir(), 'pw-shim'); mkdirSync(shim, { recursive: true })
    // Wrapper drops flags the older build does not know and swaps VP9 for VP8 (the only libvpx encoder in it).
    const dir = join(shim, `ffmpeg-${want}`); mkdirSync(dir, { recursive: true })
    const bin = join(dir, 'ffmpeg-mac')
    writeFileSync(bin, `#!/bin/bash\nargs=()\nwhile [ $# -gt 0 ]; do if [ "$1" = "-tile-columns" -o "$1" = "-row-mt" ]; then shift 2; elif [ "$1" = "libvpx-vp9" ]; then args+=("libvpx"); shift; else args+=("$1"); shift; fi; done\nexec "${join(cache, have[0], 'ffmpeg-mac')}" "\${args[@]}"\n`, { mode: 0o755 })
    writeFileSync(join(dir, 'INSTALLATION_COMPLETE'), '')
    process.env.PLAYWRIGHT_BROWSERS_PATH = shim
  }
}
const { chromium } = await import('playwright')

const here = dirname(fileURLToPath(import.meta.url))
const protoDir = resolve(here, '..')
const OUT = '/Users/apoorv/Projects/portfolio/public/work/fleet-console'
const TMP = resolve(protoDir, '../pipeline/screens/.reel-tmp')
const BASE = 'http://localhost:5185'
const CRF = Number(process.env.CRF ?? 26)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function findChromium() {
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  if (!existsSync(cache)) return undefined
  const dirs = readdirSync(cache)
  const c = [
    ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')),
    ...dirs.filter((d) => d.startsWith('chromium-')).map((d) => join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')),
  ]
  return c.find(existsSync)
}

async function up() { try { return (await fetch(BASE + '/now')).ok } catch { return false } }
let server
if (!(await up())) {
  server = spawn('npx', ['vite', '--port', '5185', '--strictPort'], { cwd: protoDir, stdio: 'ignore' })
  for (let i = 0; i < 60 && !(await up()); i++) await sleep(500)
}

rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true }); mkdirSync(OUT, { recursive: true })
const executablePath = findChromium()
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light',
  recordVideo: { dir: TMP, size: { width: 1440, height: 900 } },
})
const t0 = Date.now()
await context.addInitScript(() => {
  try { localStorage.setItem('plumb.theme', 'light'); localStorage.setItem('plumb.density', 'comfortable') } catch {}
  // Hide the surface switcher bar and show a soft cursor dot (headless video has no pointer).
  const st = document.createElement('style')
  st.textContent = '[data-switcher-bar]{display:none!important}#__cur{position:fixed;z-index:99999;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(20,20,30,.55);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:none;transition:transform .08s}#__cur.d{transform:scale(.75)}'
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st))
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div'); c.id = '__cur'; c.style.left = '-50px'; c.style.top = '-50px'; document.body.appendChild(c)
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    addEventListener('mousedown', () => c.classList.add('d'), true); addEventListener('mouseup', () => c.classList.remove('d'), true)
  })
})
const page = await context.newPage()
let cx = 720, cy = 450

async function glide(x, y, steps = 28) {
  await page.mouse.move(x, y, { steps })
  cx = x; cy = y
}
async function moveTo(loc, steps = 28) {
  await loc.scrollIntoViewIfNeeded()
  const b = await loc.boundingBox()
  await glide(b.x + b.width / 2, b.y + b.height / 2, steps)
}
async function clickOn(loc) {
  await moveTo(loc); await sleep(180); await page.mouse.down(); await sleep(70); await page.mouse.up()
}
// Client-side navigation so the module-level store persists.
async function go(path) {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, path)
  await sleep(500)
}

await page.goto(BASE + '/now', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.mouse.move(cx, cy)
const startMs = Date.now() - t0   // everything before this is dead air to trim

// 1. /now hold, hover countdown
await sleep(1500)
const timer = page.locator('.mono.tnum').filter({ hasText: /^\d+:\d\d$/ }).first()
await moveTo(timer, 40); await sleep(600)
// 2. Acknowledge, then the escalation protocol
await clickOn(page.getByRole('button', { name: 'Acknowledge' }).first()); await sleep(600)
await go('/escalations/ESC-0206'); await sleep(500)
const boxes = page.getByRole('checkbox')
await clickOn(boxes.nth(2)); await sleep(600)
await clickOn(boxes.nth(3)); await sleep(600)
// 3. iOS escalations -> takeover
await go('/ios/esc'); await sleep(800)
await clickOn(page.locator('[role="application"] button[aria-label^="ESC-"]').first()); await sleep(1100)
// 4. Vehicle: tap Phantom brake
await go('/vehicle'); await sleep(700)
await clickOn(page.getByRole('button', { name: /^Phantom brake/ })); await sleep(1200)
// 5. Inbox team scope
await go('/inbox?scope=team'); await sleep(1500)

const video = page.video()
await context.close(); await browser.close()
const raw = await video.path()
server?.kill()

const mp4 = join(OUT, 'reel.mp4'), jpg = join(OUT, 'reel.jpg')
const ss = (startMs / 1000 + 0.15).toFixed(2)
const run = (args) => { const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg failed') }
run(['-ss', ss, '-i', raw, '-vf', 'scale=1440:-2,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(CRF), '-preset', 'slow', '-movflags', '+faststart', '-an', mp4])
run(['-ss', '1', '-i', mp4, '-frames:v', '1', '-q:v', '4', jpg])
rmSync(TMP, { recursive: true, force: true })
console.log('reel.mp4', statSync(mp4).size, 'reel.jpg', statSync(jpg).size)
