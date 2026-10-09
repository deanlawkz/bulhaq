// Скриншот маршрута: node scripts/shot.mjs '#/value/adam' out.png [width=1440] [scrollY=0] [fullPage=0]
// Поднимает свой vite dev-сервер на свободном порту, так что агенты могут запускать параллельно.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [hash = '#/', out = 'shot.png', width = '1440', scrollY = '0', full = '0'] = process.argv.slice(2);
const server = await createServer({ server: { port: 0, host: '127.0.0.1', hmr: false, watch: { ignored: ['**/*'] } }, logLevel: 'error' });
await server.listen();
const port = server.httpServer.address().port;
const exe = ['/opt/pw-browsers/chromium', ...fs.readdirSync('/opt/pw-browsers').map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)].find((p) => {
  try { return fs.statSync(p).isFile(); } catch { return false; }
});
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const w = Number(width);
const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 800 : 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
if (Number(scrollY)) {
  // постепенно, чтобы сработали ScrollTrigger-ы
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), (Number(scrollY) * i) / steps);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1600);
}
await page.screenshot({ path: out, fullPage: full === '1' });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
await server.close();
