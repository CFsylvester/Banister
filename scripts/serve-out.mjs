#!/usr/bin/env node
// serve-out.mjs — serve the static export (out/) the way GitHub Pages does: mounted under PAGES_BASE_PATH,
// directories resolve to index.html, unknown paths get out/404.html. `next start` can't serve an export.
// Usage: PAGES_BASE_PATH=/Banister node scripts/serve-out.mjs [port]   → http://localhost:3217/Banister/
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("out");
const base = process.env.PAGES_BASE_PATH ?? "";
const port = Number(process.argv[2] ?? 3217);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };
if (!existsSync(root)) { console.error("serve-out: no out/ — run the Pages build first (pnpm build:pages)"); process.exit(2); }

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (base && !path.startsWith(base + "/") && path !== base) { res.writeHead(302, { location: base + "/" }); return res.end(); }
  if (path === base) { res.writeHead(301, { location: base + "/" }); return res.end(); }
  let file = join(root, normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, ""));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  else if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
  const found = existsSync(file) && file.startsWith(root);
  const body = readFileSync(found ? file : join(root, "404.html"));
  res.writeHead(found ? 200 : 404, { "content-type": types[extname(found ? file : ".html")] ?? "application/octet-stream" });
  res.end(body);
}).listen(port, () => console.log(`serve-out: http://localhost:${port}${base}/`));
