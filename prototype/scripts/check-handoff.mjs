// Proves vehicle -> desktop hand-off: tag in /vehicle, client-side navigate to /inbox?scope=team, assert the new row.
// Runs vite dev on port 5183. Usage: node scripts/check-handoff.mjs
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

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

const protoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5183, URL = `http://127.0.0.1:${PORT}`
const vite = spawn('npx', ['vite', '--port', String(PORT), '--host', '127.0.0.1', '--strictPort'], { cwd: protoDir, stdio: 'ignore' })
let ok = false, detail = ''
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(URL)).ok) break } catch {} await new Promise((r) => setTimeout(r, 500)) }
  const browser = await chromium.launch({ headless: true, executablePath: findChromium() })
  const page = await browser.newPage({ viewport: { width: 1800, height: 860 } })
  await page.goto(`${URL}/vehicle?frame=0`)
  const key = page.getByRole('button', { name: /^Phantom brake/ })
  await key.waitFor()
  await key.click()
  await page.locator('.v-toast').waitFor()
  // Client-side navigation: the in-memory store must survive (no reload).
  await page.evaluate(() => { history.pushState({}, '', '/inbox?scope=team'); dispatchEvent(new PopStateEvent('popstate')) })
  await page.waitForURL(/\/inbox\?scope=team/)
  const sel = 'span:text-is("Phantom brake at Loop A")' // new tag's title (each row renders title + vehicle suffix spans)
  await page.locator(sel).first().waitFor({ timeout: 5000 }).catch(() => {})
  const after = await page.locator(sel).count()
  const fresh = await browser.newPage({ viewport: { width: 1800, height: 860 } })
  await fresh.goto(`${URL}/inbox?scope=team`)
  await fresh.waitForTimeout(1000)
  const before = await fresh.locator(sel).count()
  ok = after === before + 1 && before === 0
  detail = `Phantom brake rows: ${before} fresh load, ${after} after tag + client-side nav`
  await browser.close()
} catch (e) { detail = String(e).split("\n").slice(0,4).join(" | ") }
vite.kill()
console.log(`${ok ? 'PASS' : 'FAIL'} handoff: ${detail}`)
process.exit(ok ? 0 : 1)
