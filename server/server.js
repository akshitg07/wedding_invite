import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 9080);
const STATE_FILE = process.env.STATE_FILE || '/data/invitation-state.json';
const DIST_DIR = path.resolve(__dirname, '../dist');

const ensureStateDir = () => {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendFile = (res, filePath) => {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  const type =
    ext === '.html' ? 'text/html' :
    ext === '.js' ? 'application/javascript' :
    ext === '.css' ? 'text/css' :
    ext === '.json' ? 'application/json' :
    ext === '.svg' ? 'image/svg+xml' :
    'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (url === '/api/state' && method === 'GET') {
    try {
      if (!fs.existsSync(STATE_FILE)) return sendJson(res, 200, { state: null });
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      return sendJson(res, 200, { state: JSON.parse(raw) });
    } catch {
      return sendJson(res, 500, { error: 'Failed to read state' });
    }
  }

  if (url === '/api/state' && method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 40 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        ensureStateDir();
        fs.writeFileSync(STATE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: 'Invalid payload' });
      }
    });
    return;
  }

  const safePath = path.normalize((url || '/').split('?')[0]).replace(/^\/+/, '');
  const target = path.join(DIST_DIR, safePath);
  if (safePath && fs.existsSync(target) && fs.statSync(target).isFile()) {
    return sendFile(res, target);
  }

  return sendFile(res, path.join(DIST_DIR, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Wedding invite server running on :${PORT}`);
});
