import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createViServer, marketSchema, scenarioSchema, VERSION } from './server.mjs';
import { z } from 'zod';
import { marketBrief, EvidenceError } from './vi/market.mjs';
import { probabilityScenario } from './vi/scenario.mjs';

const page = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const port = Number(process.env.VI_PORT || 3147);
const host = process.env.VI_HOST || '127.0.0.1';
const buckets = new Map();
const allowedHosts = new Set(['vultax.com', 'localhost', '127.0.0.1']);
const publicOrigins = new Set(['https://vultax.com', 'https://chatgpt.com', 'https://claude.ai', 'https://smithery.ai', 'https://glama.ai']);
function write(res, status, data) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); }
const handler = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
  let hostname; try { hostname = new URL(`http://${req.headers.host}`).hostname; } catch { return write(res, 400, { error: 'invalid_host' }); }
  if (!allowedHosts.has(hostname)) return write(res, 403, { error: 'invalid_host' });
  const path = new URL(req.url, 'http://localhost').pathname.replace(/^\/vi-mcp(?=\/|$)/, '') || '/';
  if (req.headers.origin) { try { const origin = new URL(req.headers.origin); if (!publicOrigins.has(origin.origin) && !(['localhost','127.0.0.1'].includes(origin.hostname) && hostname === origin.hostname)) return write(res, 403, { error: 'invalid_origin' }); res.setHeader('Access-Control-Allow-Origin', origin.origin); res.setHeader('Vary', 'Origin'); } catch { return write(res, 403, { error: 'invalid_origin' }); } }
  if (req.method === 'GET' && path === '/health') return write(res, 200, { ok: true, name: 'Vi Assistant by Vultax', version: VERSION, tools: 5 });
  if (req.method === 'GET' && path === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src https://vultax.com; base-uri 'none'; frame-ancestors 'none'; form-action 'self'", 'cache-control': 'no-store' }); return res.end(page); }
  if (req.method === 'OPTIONS') { res.writeHead(204, { Allow: 'GET, POST, OPTIONS', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, Accept' }); return res.end(); }
  if (req.method !== 'POST' || !['/', '/mcp', '/api/brief', '/api/scenario'].includes(path)) return write(res, 405, { error: 'method_not_allowed' });
  // Only trust X-Real-IP from the local reverse proxy; it never comes from tool arguments.
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const key = loopback ? String(req.headers['x-real-ip'] || req.socket.remoteAddress) : req.socket.remoteAddress;
  const minute = Math.floor(Date.now() / 60000); const hit = buckets.get(key);
  if (hit?.minute === minute && hit.count >= 60) { res.setHeader('Retry-After', '60'); return write(res, 429, { error: 'rate_limited' }); }
  if (buckets.size >= 5000 && !buckets.has(key)) return write(res, 503, { error: 'capacity' });
  buckets.set(key, { minute, count: hit?.minute === minute ? hit.count + 1 : 1 });
  let bytes = 0; const chunks = [];
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) return write(res, 413, { error: 'request_too_large' }); chunks.push(chunk); }
  let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return write(res, 400, { error: 'invalid_json' }); }
  if (path === '/api/brief') { const args = z.object(marketSchema).strict().parse(body); return write(res, 200, await marketBrief(args)); }
  if (path === '/api/scenario') { const args = z.object(scenarioSchema).strict().parse(body); return write(res, 200, probabilityScenario(args)); }
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = createViServer();
  try { await server.connect(transport); await transport.handleRequest(req, res, body); }
  finally { await server.close(); }
};
const server = http.createServer((req, res) => { handler(req, res).catch(error => { if (!res.headersSent) write(res, error instanceof z.ZodError || error instanceof EvidenceError ? 400 : 502, { error: error instanceof EvidenceError ? error.code : error instanceof z.ZodError ? 'invalid_input' : 'unavailable' }); else res.end(); }); });
server.requestTimeout = 30000; server.headersTimeout = 10000;
const cleanup = setInterval(() => { const current = Math.floor(Date.now() / 60000); for (const [key, row] of buckets) if (row.minute < current) buckets.delete(key); }, 60000); cleanup.unref();
server.listen(port, host, () => console.error(`Vi Assistant ${VERSION} listening on ${host}:${port}`));
process.on('SIGTERM', () => server.close());
