// Screenshot harness for the iOS surface. Runs `vite` DEV on port 5181 (not build/preview).
// Usage: node scripts/shoot-ios.mjs [--only esc-light,lock-dark] [--url http://localhost:5181]
// Output: pipeline/screens/ios-<name>.png (1200x1000 @2x)
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const protoDir = resolve(here, '..')
const outDir = resolve(protoDir, '../pipeline/screens')
const PORT = 5181

// name, route (without theme), optional actions: click a button by accessible name, scroll the screen
const SCREENS = [
  { name: 'escalations', route: '/ios/esc' },
  { name: 'escalations-empty', route: '/ios/esc?empty=1' },
  { name: 'takeover', route: '/ios/esc/ESC-0206' },
  { name: 'takeover-others', route: '/ios/esc/ESC-0207' },
  { name: 'takeover-acked', route: '/ios/esc/ESC-0206?demo=acked' },
  { name: 'takeover-acked-scrolled', route: '/ios/esc/ESC-0206?demo=acked', scroll: 500 },
  { name: 'handoff-sheet', route: '/ios/esc/ESC-0206', click: 'Hand off' },
  { name: 'now', route: '/ios/now' },
  { name: 'now-scrolled', route: '/ios/now', scroll: 400 },
  { name: 'incident', route: '/ios/inc/INC-4139' },
  { name: 'note-composer', route: '/ios/inc/INC-4139', click: 'Add note' },
  { name: 'inbox', route: '/ios/inbox' },
  { name: 'me', route: '/ios/me' },
  { name: 'lock', route: '/ios/lock' },
  { name: 'bare-esc', route: '/ios/esc?frame=0', viewport: { width: 393, height: 852 } },
]
const THEMES = ['light', 'dark']

const args = process.argv.slice(2)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }
const only = val('--only')?.split(',')
let baseUrl = val('--url')

const waitForHttp = async (url, ms = 30000) => {
  const end = Date.now() + ms
  while (Date.now() < end) { try { if ((await fetch(url)).ok) return } catch {} await new Promise((r) => setTimeout(r, 250)) }
  throw new Error(`No response from ${url}`)
}
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

let server = null
try {
  if (!baseUrl) {
    server = spawn(join(protoDir, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: protoDir, stdio: ['ignore', 'pipe', 'pipe'] })
    baseUrl = `http://127.0.0.1:${PORT}`
    await waitForHttp(baseUrl)
  }
  const executablePath = findChromium()
  let browser
  try { browser = await chromium.launch({ headless: true, executablePath }) } catch { browser = await chromium.launch({ headless: true }) }
  mkdirSync(outDir, { recursive: true })
  for (const s of SCREENS) for (const theme of THEMES) {
    const name = `${s.name}-${theme}`
    if (only && !only.includes(name) && !only.includes(s.name)) continue
    const ctx = await browser.newContext({ viewport: s.viewport ?? { width: 1200, height: 1000 }, deviceScaleFactor: 2, colorScheme: theme })
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(e.message))
    const url = baseUrl + s.route + (s.route.includes('?') ? '&' : '?') + `theme=${theme}`
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    if (s.scroll) { await page.evaluate((y) => document.querySelector('[data-scroll]')?.scrollTo(0, y), s.scroll); await page.waitForTimeout(200) }
    if (s.click) { await page.getByRole('button', { name: s.click }).first().click(); await page.waitForTimeout(600) }
    const file = join(outDir, `ios-${name}.png`)
    await page.screenshot({ path: file })
    console.log(`saved ${file}${errors.length ? `  (${errors.length} console errors: ${errors[0]})` : ''}`)
    await ctx.close()
  }
  await browser.close()
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  server?.kill('SIGTERM')
}
