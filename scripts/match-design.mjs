#!/usr/bin/env node
// match-design.mjs — run the visual-diff gate for every page of the design against the running Next.js app.
// Usage: node scripts/match-design.mjs [--base http://localhost:3000] [--threshold 1.0] [--only home,contact]
// Exit 0 only if EVERY page is within threshold at EVERY viewport. Viewports straddle the design's 820px
// JS breakpoint (isMobile = innerWidth < 820) plus desktop/max-width and small-phone widths.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i !== -1 ? process.argv[i + 1] : d; };
const base = arg("base", "http://localhost:3000");
const threshold = arg("threshold", "1.0");
const viewports = arg("viewports", "wide:1440x900,desktop:1280x800,edge:820x1000,tablet:819x1000,mobile:375x812");
const pages = {
  home: "/", services: "/services", industries: "/industries", about: "/about",
  insights: "/insights", article: "/insights/state-of-talent-acquisition", contact: "/contact",
};
const only = arg("only")?.split(",");
const rows = []; let ok = true;
for (const [name, path] of Object.entries(pages)) {
  if (only && !only.includes(name)) continue;
  const r = spawnSync(process.execPath, ["scripts/visual-diff.mjs",
    "--target", `design/banister-v2.dc.html?startPage=${name}`, "--candidate", base + path,
    "--threshold", threshold, "--viewports", viewports, "--full-page", "--wait", "2600", "--expect", "Banister International", "--out", `visual-diff-out/${name}`],
    { encoding: "utf8" });
  const sum = `visual-diff-out/${name}/summary.json`;
  if (r.status === 2 || !existsSync(sum)) { console.error(r.stderr); process.exit(2); }
  const s = JSON.parse(readFileSync(sum, "utf8"));
  rows.push([name, ...s.results.map((x) => `${x.viewport} ${x.driftPct}%`), s.pass ? "MATCH" : "MISMATCH"]);
  ok &&= s.pass;
}
for (const r of rows) console.log(r.join("  |  "));
console.log(ok ? "ALL PAGES MATCH" : "MISMATCH — see visual-diff-out/<page>/*-diff.png");
process.exit(ok ? 0 : 1);
