// Screenshot harness for the Fleet Console prototype.
//
// Usage:
//   npm run shoot                       # build, serve dist/ with vite preview on a free port, shoot all
//   npm run shoot -- --url http://localhost:5173   # reuse a running server instead
//   npm run shoot -- --only now-light,inbox-dark-compact   # subset by shot name
//
// Env:
//   CHROMIUM_PATH  path to a Chromium/Chrome binary (default: Playwright cache, then Playwright's bundled browser)
//
// Output: pipeline/screens/<name>.png and pipeline/screens/console.txt

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const protoDir = resolve(here, '..')
const outDir = resolve(protoDir, '../pipeline/screens')

// name, route, theme, density, fullPage
const SHOTS = [
  { name: 'now-light', route: '/now', theme: 'light', density: 'comfortable' },
  { name: 'now-dark', route: '/now', theme: 'dark', density: 'comfortable' },
  { name: 'inbox-light', route: '/inbox', theme: 'light', density: 'comfortable' },
  { name: 'inbox-dark-compact', route: '/inbox', theme: 'dark', density: 'compact' },
  { name: 'inbox-team-light', route: '/inbox?scope=team', theme: 'light', density: 'comfortable' },
  { name: 'incident-sev1-light', route: '/incidents/INC-4140', theme: 'light', density: 'comfortable' },
  { name: 'incident-sev1-dark', route: '/incidents/INC-4140', theme: 'dark', density: 'comfortable' },
  { name: 'incident-stale-light', route: '/incidents/INC-4110', theme: 'light', density: 'comfortable' },
  { name: 'escalation-active-dark', route: '/escalations/ESC-0207', theme: 'dark', density: 'comfortable' },
  { name: 'escalation-active-light', route: '/escalations/ESC-0207', theme: 'light', density: 'comfortable' },
  { name: 'escalation-acked-light', route: '/escalations/ESC-0206?demo=acked', theme: 'light', density: 'comfortable' },
  { name: 'escalation-rerouted-light', route: '/escalations/ESC-0206', theme: 'light', density: 'comfortable' },
  { name: 'gallery-light', route: '/gallery', theme: 'light', density: 'comfortable', fullPage: true },
  { name: 'specimen-light', route: '/specimen', theme: 'light', density: 'comfortable' },
  { name: 'specimen-dark', route: '/specimen', theme: 'dark', density: 'comfortable' },
  // full-page variants
  { name: 'now-light-full', route: '/now', theme: 'light', density: 'comfortable', fullPage: true },
  { name: 'incident-sev1-light-full', route: '/incidents/INC-4140', theme: 'light', density: 'comfortable', fullPage: true },
]

const args = process.argv.slice(2)
const argValue = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const reuseUrl = argValue('--url')
const only = argValue('--only')?.split(',').map((s) => s.trim())
const shots = only ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS
if (only && shots.length === 0) {
  console.error(`No shots match --only ${argValue('--only')}`)
  process.exit(1)
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const srv = createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolvePort(port))
    })
  })
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs} ms`)
}

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  if (!existsSync(cache)) return undefined
  // Prefer the headless shell (smallest, built for headless), then full Chromium.
  const dirs = readdirSync(cache).sort().reverse()
  const candidates = [
    ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')),
    ...dirs.filter((d) => d.startsWith('chromium-')).map((d) => join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')),
  ]
  return candidates.find((p) => existsSync(p))
}

let server = null
let serverLog = ''
let baseUrl = reuseUrl?.replace(/\/$/, '')

async function startPreview() {
  console.log('Building prototype (npm run build)...')
  const build = spawnSync('npm', ['run', 'build'], { cwd: protoDir, stdio: 'inherit' })
  if (build.status !== 0) throw new Error('npm run build failed')

  const port = await freePort()
  console.log(`Starting vite preview on port ${port}...`)
  server = spawn(join(protoDir, 'node_modules/.bin/vite'), ['preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: protoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout.on('data', (d) => (serverLog += d))
  server.stderr.on('data', (d) => (serverLog += d))
  baseUrl = `http://127.0.0.1:${port}`
  await waitForHttp(baseUrl)
}

function stopPreview() {
  if (server && !server.killed) {
    server.kill('SIGTERM')
    server = null
  }
}

async function main() {
  if (!baseUrl) await startPreview()
  console.log(`Using ${baseUrl}`)

  const executablePath = findChromium()
  let browser
  try {
    browser = await chromium.launch({ headless: true, executablePath })
  } catch (err) {
    if (!executablePath) throw err
    console.warn(`Launch with ${executablePath} failed (${err.message.split('\n')[0]}); trying Playwright's bundled browser.`)
    browser = await chromium.launch({ headless: true })
  }
  console.log(`Browser: ${browser.version()} (${executablePath ?? 'Playwright bundled'})`)

  mkdirSync(outDir, { recursive: true })
  const consoleLines = []
  let failures = 0

  try {
    for (const shot of shots) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      })
      // Set theme/density before any page script runs. Only applies to this origin.
      await context.addInitScript(
        ({ theme, density }) => {
          try {
            localStorage.setItem('plumb.theme', theme)
            localStorage.setItem('plumb.density', density)
          } catch {
            /* storage blocked */
          }
        },
        { theme: shot.theme, density: shot.density },
      )
      const page = await context.newPage()
      const errors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`)
      })
      page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
      page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText ?? ''}`))

      const url = baseUrl + shot.route
      try {
        await page.goto(url, { waitUntil: 'networkidle' })
        await page.waitForTimeout(300)
        if (shot.fullPage) {
          // The app scrolls inside <main>, so Playwright's fullPage sees only the viewport. Grow the viewport to the content height instead.
          const extra = await page.evaluate(() => { const m = document.getElementById('main'); return m ? m.scrollHeight - m.clientHeight : 0 })
          if (extra > 0) { const vp = page.viewportSize(); await page.setViewportSize({ width: vp.width, height: vp.height + extra }); await page.waitForTimeout(200) }
        }
        const file = join(outDir, `${shot.name}.png`)
        await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) })
        console.log(`saved ${file}`)
      } catch (err) {
        failures++
        errors.push(`[shot-failed] ${err.message.split('\n')[0]}`)
        console.error(`FAILED ${shot.name}: ${err.message.split('\n')[0]}`)
      }

      consoleLines.push(`## ${shot.name} (${shot.route}, ${shot.theme}, ${shot.density})`)
      consoleLines.push(...(errors.length ? errors : ['(no console errors)']))
      consoleLines.push('')
      await context.close()
    }
  } finally {
    await browser.close()
    const errorCount = consoleLines.filter((l) => l.startsWith('[')).length
    writeFileSync(join(outDir, 'console.txt'), `Console errors/warnings for ${shots.length} shots against ${baseUrl}\n\n${consoleLines.join('\n')}\n`)
    console.log(`Wrote ${join(outDir, 'console.txt')} (${errorCount} console entries)`)
    if (failures) process.exitCode = 1
  }
}

try {
  await main()
} catch (err) {
  console.error(err.message)
  if (serverLog) console.error(serverLog)
  process.exitCode = 1
} finally {
  stopPreview()
}
