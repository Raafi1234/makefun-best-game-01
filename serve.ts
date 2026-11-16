// A minimal static server for local play-tests: `node serve.ts [--port N]`
// serves game/ at http://localhost:8080. Standard library only; paths are
// confined to game/ and nothing else is served.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const parsed = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = resolve(join(root, normalize(decodeURIComponent(url.pathname))));
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  const file = url.pathname === '/' ? join(root, 'index.html') : path;
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`Gloamkeeper at http://localhost:${port}`);
});
