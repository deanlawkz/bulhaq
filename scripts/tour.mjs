// Тур по странице: node scripts/tour.mjs '#/' outDir [width=1440] [step=0.9 (доля экрана)]
// Скроллит постепенно (чтобы срабатывали ScrollTrigger/pin), снимает кадры, собирает contact sheet (если есть ImageMagick).
// Печатает: высоту документа, горизонтальное переполнение, ошибки консоли.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const [hash = '#/', out = 'tour', width = '1440', step = '0.9'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ server: { port: 0, host: '127.0.0.1', hmr: false, watch: { ignored: ['**/*'] } }, logLevel: 'error' });
await server.listen();
const port = server.httpServer.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const w = Number(width), hgt = w < 600 ? 800 : 900;
const page = await browser.newPage({ viewport: { width: w, height: hgt } });
if (process.env.HAK_LANG) await page.addInitScript((l) => { try { localStorage.setItem('hak.lang', l); } catch {} }, process.env.HAK_LANG);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));
await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
const files = [];
let y = 0, i = 0;
while (y < H && i < 60) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(700);
  const f = `${out}/${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: f });
  files.push(f);
  i++;
  y += hgt * Number(step);
  // докручиваем мелкими шагами, чтобы scrub-анимации прошли
  for (let k = 1; k <= 4; k++) await page.evaluate((yy) => window.scrollTo(0, yy), y - hgt * Number(step) * (1 - k / 4));
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(JSON.stringify({ height: H, frames: files.length, horizontalOverflowPx: overflow, errors }, null, 1));
try {
  execSync(`montage ${files.join(' ')} -tile 4x -geometry ${w < 600 ? '260x' : '480x'}+6+6 -background '#111' ${out}/sheet.png`);
} catch {}
await browser.close();
await server.close();
