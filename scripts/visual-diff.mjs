#!/usr/bin/env node
// visual-diff.mjs — render TARGET + CANDIDATE with Playwright, pixel-diff with pixelmatch, exit 0 iff
// max viewport drift% <= threshold. Deps: playwright, pixelmatch, pngjs (+ npx playwright install chromium).
//
// Based on the agents-kit `visual-design` agent's gate, with four additive changes for full-site fidelity:
//  --full-page   scroll the whole page first (fires IntersectionObserver reveals), then capture fullPage.
//  --wait <ms>   settle time after load/scroll, for JS-driven animation (rAF count-ups) to finish.
//  animations:"disabled" on capture — finite CSS animations/transitions are fast-forwarded to their end
//                state, infinite ones reset (playwright-core types.d.ts, Page.screenshot `animations`).
//  --steps <json>  interaction script run identically on BOTH pages before capture, e.g.
//                '[{"click":"text=READ FULL BIO"},{"fill":["input[type=email]","a@b.co"]},{"hover":"text=LEARN MORE"},{"wait":1500}]'
//                Selectors are Playwright selectors; each targets the FIRST match. Use selectors that exist in both.
//  Size mismatch is counted as drift (the original cropped to the smaller image, so a missing section at
//  the bottom of the candidate was invisible to the gate).
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i !== -1 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const die = (m) => { console.error(`visual-diff: ${m}`); process.exit(2); };
const target = arg("target") || die("need --target");
const candidate = arg("candidate") || die("need --candidate");
const threshold = parseFloat(arg("threshold", "1.0"));
const pmThreshold = parseFloat(arg("pm-threshold", "0.1"));
const includeAA = has("include-aa");
const fullPage = has("full-page");
const wait = parseInt(arg("wait", "0"), 10);
const steps = JSON.parse(arg("steps", "[]"));
// A selector may be a [targetSelector, candidateSelector] pair when the two DOMs differ (side 0 = target).
const runSteps = async (page, side) => { const L = (s) => page.locator(Array.isArray(s) ? s[side] : s).first();
  for (const st of steps) {
  if (st.click) await L(st.click).click();
  else if (st.hover) await L(st.hover).hover();
  else if (st.fill) await L(st.fill[0]).fill(st.fill[1]);
  else if (st.check) await L(st.check).check();
  else if (st.press) await L(st.press[0]).press(st.press[1]);
  else if (st.wait) await page.waitForTimeout(st.wait);
  else die(`unknown step ${JSON.stringify(st)}`);
} };
const outDir = resolve(arg("out", "visual-diff-out"));
const viewports = arg("viewports", "desktop:1200x800,mobile:375x812").split(",").map((v) => {
  const [name, d] = v.split(":"); const [w, h] = d.split("x").map(Number); return { name, width: w, height: h }; });
const toUrl = (s) => /^(https?|file):\/\//.test(s) ? s : "file://" + resolve(s);
let chromium, pixelmatch, PNG;
try { ({ chromium } = await import("playwright")); pixelmatch = (await import("pixelmatch")).default; ({ PNG } = await import("pngjs")); }
catch (e) { die(`missing deps — npm i -D playwright pixelmatch pngjs && npx playwright install chromium (${e.message})`); }
mkdirSync(outDir, { recursive: true });
const shoot = async (page, url, file, vp, side) => {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(url, { waitUntil: "networkidle" }).catch(() => page.goto(url));
  await page.evaluate(() => document.fonts.ready);
  if (fullPage) {
    await page.evaluate(async () => {
      const step = Math.max(200, innerHeight / 2);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      scrollTo(0, 0);
    });
  }
  if (wait) await page.waitForTimeout(wait);
  await runSteps(page, side);
  await page.screenshot({ path: file, fullPage, animations: "disabled" }); };
// Pad an image to w×h with opaque magenta so size differences register as mismatched pixels.
const pad = (img, w, h) => { if (img.width === w && img.height === h) return img;
  const o = new PNG({ width: w, height: h }); o.data.fill(0);
  for (let i = 0; i < o.data.length; i += 4) { o.data[i] = 255; o.data[i + 2] = 255; o.data[i + 3] = 255; }
  PNG.bitblt(img, o, 0, 0, img.width, img.height, 0, 0); return o; };
const browser = await chromium.launch(); const results = [];
try {
  for (const vp of viewports) {
    const page = await browser.newPage();
    const t = `${outDir}/${vp.name}-target.png`, c = `${outDir}/${vp.name}-candidate.png`, df = `${outDir}/${vp.name}-diff.png`;
    await shoot(page, toUrl(target), t, vp, 0); await shoot(page, toUrl(candidate), c, vp, 1); await page.close();
    const ra = PNG.sync.read(readFileSync(t)), rb = PNG.sync.read(readFileSync(c));
    const width = Math.max(ra.width, rb.width), height = Math.max(ra.height, rb.height);
    const a = pad(ra, width, height), b = pad(rb, width, height); const diff = new PNG({ width, height });
    const px = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: pmThreshold, includeAA });
    writeFileSync(df, PNG.sync.write(diff));
    const drift = (px / (width * height)) * 100;
    results.push({ viewport: vp.name, driftPct: +drift.toFixed(3), targetH: ra.height, candidateH: rb.height, diff: df });
    console.error(`visual-diff: ${vp.name} drift ${drift.toFixed(3)}% (h ${ra.height} vs ${rb.height}) → ${df}`);
  }
} finally { await browser.close(); }
const maxDrift = Math.max(...results.map((r) => r.driftPct)); const pass = maxDrift <= threshold;
writeFileSync(`${outDir}/summary.json`, JSON.stringify({ target, candidate, threshold, maxDrift, pass, results }, null, 2));
console.error(`visual-diff: MAX ${maxDrift.toFixed(3)}% vs ${threshold}% → ${pass ? "MATCH" : "MISMATCH"}`);
console.log(maxDrift.toFixed(3)); process.exit(pass ? 0 : 1);
