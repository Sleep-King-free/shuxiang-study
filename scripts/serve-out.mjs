import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'out');
const PORT = 3200;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const candidates = [clean, `${clean}.html`, join(clean, 'index.html')];
  for (const c of candidates) {
    try {
      const p = join(ROOT, c);
      const s = await stat(p);
      if (s.isFile()) return p;
    } catch {
      /* try next */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = await resolve(url.pathname === '/' ? '/index.html' : url.pathname);
  if (!file) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end('<h1>404</h1>');
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(body);
}).listen(PORT, () => console.log(`static server on http://localhost:${PORT} (${ROOT})`));
