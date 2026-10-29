// Embed check: 1100x688 viewport (16:10). Needs vite dev on port 5184 (npx vite --port 5184).
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../pipeline/screens')
mkdirSync(out, { recursive: true })
const base = process.env.BASE || 'http://localhost:5184'
const cache = join(homedir(), 'Library/Caches/ms-playwright')
const exe = existsSync(cache) ? readdirSync(cache).sort().reverse().filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')).find(existsSync) : undefined
const browser = await chromium.launch({ headless: true, executablePath: exe })
const page = await (await browser.newContext({ viewport: { width: 1100, height: 688 } })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
const shoot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: join(out, `embed-${n}.png`) }) }
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1 } else console.log('ok', m) }
await page.goto(base + '/?embed=1', { waitUntil: 'networkidle' }); await shoot('landing')
await page.goto(base + '/now?embed=1', { waitUntil: 'networkidle' }); await shoot('desktop')
const sw = (l) => page.locator('[data-switcher-bar] button', { hasText: l })
assert(await sw('Desktop').getAttribute('aria-current') === 'page', 'desktop current')
await page.goto(base + '/inbox', { waitUntil: 'networkidle' }); await shoot('desktop-inbox')
assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow on desktop')
await sw('iPhone').click(); await page.waitForTimeout(300)
assert(new URL(page.url()).pathname.startsWith('/ios'), 'iPhone route ' + page.url()); await shoot('ios')
await sw('In-vehicle').click(); await page.waitForTimeout(300)
assert(new URL(page.url()).pathname === '/vehicle', 'vehicle route'); await shoot('vehicle')
await sw('Desktop').click(); await page.waitForTimeout(300)
assert(new URL(page.url()).pathname === '/now', 'back to /now')
await page.keyboard.press('Tab'); 
await page.goto(base + '/vehicle/hazard', { waitUntil: 'networkidle' }); await shoot('vehicle-hazard')
await page.goto(base + '/ios/esc/ESC-0206', { waitUntil: 'networkidle' }); await shoot('ios-takeover')
assert(errs.length === 0, 'no page errors ' + errs.join('|'))
await browser.close()
