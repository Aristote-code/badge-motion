// Badge studio: serves this folder and live-reloads the animation whenever an .svg is saved.
//   node studio.mjs            → http://localhost:5178
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 5178;
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json' };
const clients = new Set();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': hi\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const rel = url.pathname === '/' ? '/rocket-badge.html' : decodeURIComponent(url.pathname);
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Badge studio running → http://localhost:${PORT}\nEdit and save any .svg in ${ROOT} and the animation reloads.`));

let pending;
fs.watch(ROOT, (_, name) => {
  if (!name || !name.endsWith('.svg')) return;
  clearTimeout(pending);
  pending = setTimeout(() => {
    console.log(`changed: ${name}`);
    for (const c of clients) c.write(`data: ${name}\n\n`);
  }, 150);
});
