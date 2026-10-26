// Export the animation from the current SVG.
//   node render.mjs                     → insight-badge-intro.mp4, insight-badge-idle-loop.mp4 (both with sound), insight-badge.png,
//                                         insight-badge-sound.wav, insight-badge.ahap (iOS), insight-badge-haptics-android.kt, insight-badge-haptics.json
//   node render.mjs --svg other.svg     → animate a different SVG file (outputs are named after it)
//   node render.mjs --size 720          → change resolution (default 1080)
//   node render.mjs --extras            → only the sound + haptics files (no video)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : def; };
const svg = arg('svg', 'insight-badge.svg');
const size = +arg('size', 1080);
const fps = +arg('fps', 60);
const base = path.basename(svg, '.svg');

// Use Chrome / a Playwright Chromium if one is installed
function findChrome() {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(cache)) {
    for (const d of fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()) {
      const exe = path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (fs.existsSync(exe)) return { executablePath: exe };
    }
  }
  return { channel: 'chrome' };
}

const browser = await chromium.launch(findChrome());
const page = await browser.newPage({ viewport: { width: size, height: size } });
// Serve this folder to the page from memory (no server needed)
await page.route('http://badge.local/**', route => {
  const file = path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
  route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.svg') ? 'image/svg+xml' : 'text/html' });
});
await page.goto(`http://badge.local/insight-badge.html?capture=1&svg=${encodeURIComponent(svg)}`);
await page.evaluate(() => window.ready);
const { intro, loop } = await page.evaluate(() => window.BADGE_CONFIG);
const title = base.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

async function video(out, t0, t1, audio) {
  const silent = out.replace(/\.mp4$/, '.tmp.mp4'), wav = out.replace(/\.mp4$/, '.tmp.wav');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), t0 + i / fps);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
    if (i % 60 === 0) process.stdout.write(`\r${path.basename(out)} ${Math.round(i / n * 100)}%`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  // Sound: rendered offline from the same cue sheet, then muxed in
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(a => window.renderAudio(...a), audio), 'base64'));
  await new Promise((res, rej) => spawn('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' })
    .on('close', c => c ? rej(new Error('ffmpeg mux failed')) : res()));
  fs.rmSync(silent); fs.rmSync(wav);
  console.log(`\r${path.basename(out)} done   `);
}

const extrasOnly = process.argv.includes('--extras');   // skip videos, only sound + haptics
if (!extrasOnly) {
await video(path.join(ROOT, `${base}-intro.mp4`), 0, intro + loop, [0, intro + loop]);
// the loop is taken from the 2nd idle cycle, where every idle motion is fully running (seamless wrap)
await video(path.join(ROOT, `${base}-idle-loop.mp4`), intro + loop, intro + 2 * loop, [intro, intro + 2 * loop, intro + loop]);
await page.evaluate(t => window.render(t), intro);
await page.screenshot({ path: path.join(ROOT, `${base}.png`) });
console.log(`${base}.png done`);
}

// Standalone sound + haptics
const soundFile = `${base}-sound.wav`;
fs.writeFileSync(path.join(ROOT, soundFile), Buffer.from(await page.evaluate(end => window.renderAudio(0, end), intro + 0.8), 'base64'));
const h = await page.evaluate(f => window.badgeHaptics(f), soundFile);
fs.writeFileSync(path.join(ROOT, `${base}.ahap`), JSON.stringify(h.ahap, null, 2));
fs.writeFileSync(path.join(ROOT, `${base}-haptics.json`), JSON.stringify({ events: h.events, android: h.android, webVibrate: h.web }, null, 2));
fs.writeFileSync(path.join(ROOT, `${base}-haptics-android.kt`), `// ${title} haptics, generated from the cue sheet in ${base}.html
// Play together with ${soundFile}, starting both when the badge animation starts.
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object ${title}Haptics {
    private val timings = longArrayOf(${h.android.timings.join(', ')})
    private val amplitudes = intArrayOf(${h.android.amplitudes.join(', ')})

    fun play(vibrator: Vibrator) {
        if (Build.VERSION.SDK_INT >= 26 && vibrator.hasAmplitudeControl()) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else if (Build.VERSION.SDK_INT >= 26) {
            // No amplitude control: on/off only
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, ${h.web.join(', ')}), -1))
        }
    }
}
`);
console.log(`${soundFile}, ${base}.ahap, ${base}-haptics-android.kt, ${base}-haptics.json done`);
await browser.close();
