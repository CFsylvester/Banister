#!/usr/bin/env node
// match-interactions.mjs — pixel-gate the design's interactive states: each scenario runs the SAME clicks /
// typing / hovers on the design target and the Next.js build, then diffs the settled result.
// Usage: node scripts/match-interactions.mjs [--base http://localhost:3217] [--threshold 1.0] [--only menu-open]
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i !== -1 ? process.argv[i + 1] : d; };
const base = arg("base", "http://localhost:3217");
const threshold = arg("threshold", "1.0");
const only = arg("only")?.split(",");
const D = "desktop:1280x800", M = "mobile:375x812";
const contactFill = [
  { fill: ['label:has-text("First name") input', "Ada"] }, { fill: ['label:has-text("Last name") input', "Lovelace"] },
  { fill: ['label:has-text("Email address") input', "ada@example.com"] }, { fill: ['label:has-text("Phone") input', "5555550100"] },
  { fill: ["textarea", "Hello"] }, { check: "input[type=checkbox]" },
];
const scenarios = {
  "menu-open": { page: "home", path: "/", vps: M, steps: [{ click: '[aria-label="Menu"]' }, { wait: 600 }] },
  "bio-open": { page: "about", path: "/about", vps: `${D},${M}`, steps: [{ click: "text=READ FULL BIO" }, { wait: 900 }] },
  "contact-employer": { page: "contact", path: "/contact", vps: `${D},${M}`, steps: [{ click: "text=FOR EMPLOYERS" }] },
  "contact-sending": { page: "contact", path: "/contact", vps: D, steps: [...contactFill, { click: "text=SUBMIT" }, { wait: 400 }] },
  "contact-sent": { page: "contact", path: "/contact", vps: `${D},${M}`, steps: [...contactFill, { click: "text=SUBMIT" }, { wait: 2600 }] },
  "subscribe-empty": { page: "home", path: "/", vps: D, steps: [{ click: '[aria-label="Subscribe"]' }, { wait: 500 }] },
  "subscribe-invalid": { page: "home", path: "/", vps: D, steps: [{ fill: ['[placeholder="EMAIL ADDRESS"]', "not-an-email"] }, { click: '[aria-label="Subscribe"]' }, { wait: 500 }] },
  "subscribe-sent": { page: "home", path: "/", vps: `${D},${M}`, steps: [{ fill: ['[placeholder="EMAIL ADDRESS"]', "ada@example.com"] }, { click: '[aria-label="Subscribe"]' }, { wait: 1500 }] },
  "quote-2": { page: "home", path: "/", vps: D, steps: [{ click: ['div[style*="gap: 12px"] > span >> nth=1', '[aria-label="Show testimonial 2"]'] }, { wait: 2600 }] },
  "learn-more-hover": { page: "insights", path: "/insights", vps: D, steps: [{ hover: "text=LEARN MORE" }, { wait: 200 }] },
};
const rows = []; let ok = true;
for (const [name, s] of Object.entries(scenarios)) {
  if (only && !only.includes(name)) continue;
  const r = spawnSync(process.execPath, ["scripts/visual-diff.mjs",
    "--target", `design/banister-v2.dc.html?startPage=${s.page}`, "--candidate", base + s.path,
    "--threshold", threshold, "--viewports", s.vps, "--full-page", "--wait", "2600",
    "--steps", JSON.stringify(s.steps), "--out", `visual-diff-out/ix-${name}`], { encoding: "utf8" });
  const sum = `visual-diff-out/ix-${name}/summary.json`;
  if (r.status === 2 || !existsSync(sum)) { console.error(`${name}: gate error\n${r.stderr}`); ok = false; continue; }
  const j = JSON.parse(readFileSync(sum, "utf8"));
  rows.push([name, ...j.results.map((x) => `${x.viewport} ${x.driftPct}%`), j.pass ? "MATCH" : "MISMATCH"]);
  ok &&= j.pass;
}
for (const r of rows) console.log(r.join("  |  "));
console.log(ok ? "ALL INTERACTIONS MATCH" : "MISMATCH — see visual-diff-out/ix-<scenario>/*-diff.png");
process.exit(ok ? 0 : 1);
