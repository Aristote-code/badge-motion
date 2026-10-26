// Visual + loop checks for a badge engine.
//   node check.mjs <slug> frames 0.5,1.0,1.5,...   → <slug>/check/sheet.png (contact sheet) + console layer report
//   node check.mjs <slug> loop                     → PSNR between frames one loop apart (should be > 55 dB)
//   node check.mjs <slug> svg                      → renders the raw SVG to <slug>/check/artwork.png
import { chromium } from 'playwright-core';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , slug, mode = 'frames', timesArg] = process.argv;
const DIR = path.join('/Users/ariga/Documents/badges', slug);
const OUT = path.join(DIR, 'check');
fs.mkdirSync(OUT, { recursive: true });
const cache = path.join(process.env.HOME, 'Library/Caches/ms-playwright');
const chromiumDir = fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()[0];
const exe = path.join(cache, chromiumDir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: exe });

if (mode === 'svg') {
  const page = await browser.newPage({ viewport: { width: 840, height: 960 } });
  await page.goto('file://' + path.join(DIR, `${slug}-badge.svg`));
  await page.screenshot({ path: path.join(OUT, 'artwork.png') });
  console.log('artwork →', path.join(OUT, 'artwork.png'));
  await browser.close(); process.exit(0);
}

const page = await browser.newPage({ viewport: { width: 500, height: 500 } });
const logs = [];
page.on('console', m => logs.push(m.text()));
page.on('pageerror', e => logs.push('PAGE ERROR: ' + e.message));
await page.route('http://badge.local/**', r => {
  const f = path.join(DIR, decodeURIComponent(new URL(r.request().url()).pathname));
  if (!fs.existsSync(f)) return r.fulfill({ status: 404 });
  r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' });
});
await page.goto(`http://badge.local/${slug}-badge.html?capture=1`);
await page.evaluate(() => window.ready);
const cfg = await page.evaluate(() => window.BADGE_CONFIG);

if (mode === 'loop') {
  const t0 = cfg.intro + cfg.loop + 1.3, t1 = t0 + cfg.loop;
  for (const [t, n] of [[t0, 'a'], [t1, 'b']]) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(OUT, `loop_${n}.png`) }); }
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', path.join(OUT, 'loop_a.png'), '-i', path.join(OUT, 'loop_b.png'), '-lavfi', 'psnr', '-f', 'null', '-']).stderr.toString();
  console.log('loop PSNR (dB, >55 = seamless, inf = identical):', (/average:(\S+)/.exec(r) || [])[1]);
} else {
  const times = (timesArg || '0.3,0.8,1.3,1.8,2.3,2.8,3.3,3.8,4.6,6,7,8').split(',').map(Number);
  const files = [];
  for (const t of times) { const f = path.join(OUT, `f_${t}.png`); await page.evaluate(t => window.render(t), t); await page.screenshot({ path: f }); files.push(f); }
  const cols = 4, rows = Math.ceil(files.length / cols);
  while (files.length < cols * rows) files.push(files[files.length - 1]);
  const inputs = files.flatMap(f => ['-i', f]);
  const rowsF = Array.from({ length: rows }, (_, r) => `${Array.from({ length: cols }, (_, c) => `[${r * cols + c}]`).join('')}hstack=${cols}[r${r}]`).join(';');
  const filter = rows > 1 ? `${rowsF};${Array.from({ length: rows }, (_, r) => `[r${r}]`).join('')}vstack=${rows},scale=1400:-1` : rowsF.replace('[r0]', ',scale=1400:-1');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, path.join(OUT, 'sheet.png')]);
  console.log('sheet →', path.join(OUT, 'sheet.png'), 'times:', times.join(','));
}
console.log(logs.filter(l => /layers found|ERROR|Error/.test(l)).join('\n'));
await browser.close();
