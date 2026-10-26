// Builds the deployable showcase site into ./site
//   node build-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'site');
const BADGES = ['rocket', 'compass', 'abacus', 'shapes', 'measure', 'insight', 'code-cracker', 'bookworm', 'wordsmith', 'grammar-guardian', 'golden-mic', 'chatterbox', 'pen-pal', 'globetrotter', 'spelling-wizard', 'memory-keeper'];
const FILES = b => [`${b}-badge.html`, `${b}-badge.svg`, `${b}-badge-intro.mp4`, `${b}-badge-idle-loop.mp4`, `${b}-badge.png`,
  `${b}-badge-sound.wav`, `${b}-badge.ahap`, `${b}-badge-haptics-android.kt`, `${b}-badge-haptics.json`, 'README.md'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'showcase/index.html'), path.join(OUT, 'index.html'));
let total = 0;
for (const b of BADGES) {
  const dir = path.join(OUT, 'badges', b);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FILES(b)) {
    const src = path.join(ROOT, b, f);
    if (!fs.existsSync(src)) { console.warn(`missing: ${b}/${f}`); continue; }
    fs.copyFileSync(src, path.join(dir, f));
    total += fs.statSync(src).size;
  }
}
fs.writeFileSync(path.join(OUT, 'netlify.toml'), `[[headers]]
  for = "/badges/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"
[[headers]]
  for = "/*.ahap"
  [headers.values]
    Content-Type = "application/json"
[[headers]]
  for = "/*.kt"
  [headers.values]
    Content-Type = "text/plain; charset=utf-8"
`);
console.log(`site built → ${OUT} (${(total / 1e6).toFixed(1)} MB of badge files)`);
