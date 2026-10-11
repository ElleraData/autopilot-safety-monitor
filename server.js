/*
 * server.js
 * A tiny static file server with no dependencies, so `npm start` works anywhere
 * (a laptop, Replit, a small VPS). It serves this folder and nothing outside it.
 *
 *   npm start            -> http://localhost:3000
 *   PORT=8080 npm start  -> http://localhost:8080
 *
 * The app itself is plain HTML, CSS and JavaScript, so any static host works too.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

// Only these top-level entries are served. Tests, scripts and package files stay private.
const PUBLIC = new Set(['index.html', 'css', 'src', 'docs', 'dist', 'favicon.ico']);

function resolve(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0]);
  } catch (e) {
    return null; // malformed percent-encoding
  }
  if (pathname.includes('\0')) return null;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null; // path traversal
  const top = path.relative(ROOT, file).split(path.sep)[0];
  return PUBLIC.has(top) ? file : null;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  const file = resolve(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log('Autopilot Telemetry is running at http://localhost:' + PORT);
  });
}

module.exports = { server, resolve };
