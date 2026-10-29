// After `next build`: fail if anything from the Ezekia client reached browser JS. Client chunks live in
// .next/static; server code stays in .next/server. Run in CI after the build.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = ".next/static";
const needles = ["ezekia.com/api", "EZEKIA_API_TOKEN"];
if (process.env.EZEKIA_API_TOKEN) needles.push(process.env.EZEKIA_API_TOKEN);
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
let files;
try { files = walk(root).filter((p) => /\.(js|mjs|map|html|json)$/.test(p)); }
catch { console.error(`check-client-bundle: ${root} not found — run \`pnpm build\` first`); process.exit(2); }
const hits = files.filter((p) => { const s = readFileSync(p, "utf8"); return needles.some((n) => s.includes(n)); });
if (hits.length) { console.error(`check-client-bundle: Ezekia client code or token found in browser bundles:\n  ${hits.join("\n  ")}`); process.exit(1); }
console.log(`check-client-bundle: OK (${files.length} client files, no Ezekia client code or token)`);
