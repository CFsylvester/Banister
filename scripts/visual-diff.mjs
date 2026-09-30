#!/usr/bin/env node
// visual-diff.mjs — render TARGET + CANDIDATE with Playwright, pixel-diff with pixelmatch, exit 0 iff the worst
// drift% <= threshold. Exit 0 = MATCH, 1 = MISMATCH (pixels differ), 2 = usage / infra error (bad flag, bad
// --steps, missing selector, unreachable URL, --expect not found) — a 2 is never a reason to edit the UI.
// Deps: playwright, pixelmatch, pngjs (+ npx playwright install chromium).
// Flags beyond --target/--candidate/--threshold/--viewports/--out/--pm-threshold/--include-aa:
//  --full-page      scroll the whole page instantly (fires IntersectionObserver reveals, even under
//                   scroll-behavior:smooth), then capture fullPage. Drift is then gated on the WORST
//                   viewport-height band, not the page average, so one broken card can't hide in a long page.
//  --wait <ms>      settle time after load/scroll, for JS-driven animation (rAF count-ups) to finish.
//  --steps <json>   interaction script run identically on BOTH pages before capture, e.g.
//                   '[{"click":"text=READ MORE"},{"fill":["input[type=email]","a@b.co"]},{"hover":"nav a"},{"wait":800}]'
//                   (kinds: click hover fill check press wait). Each selector targets the FIRST match; a
//                   [targetSelector, candidateSelector] pair is allowed when the two DOMs differ. 10s per action.
//  --expect <text>  candidate identity check, run first: exit 2 unless the candidate's source text
//                   (textContent, so CSS text-transform is ignored; case-insensitive) contains <text>.
// Since the full-site upgrade, captures ALWAYS use animations:"disabled" (finite CSS animations/transitions
// fast-forward to their end state, infinite ones reset —
// https://playwright.dev/docs/api/class-page#page-screenshot-option-animations) and await document.fonts.ready,
// so drift on animated pages differs from earlier versions of this gate.
// Any size mismatch counts as drift: every pixel outside the shared overlap is a mismatch (never cropped away).
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
const expect = arg("expect");
const outDir = resolve(arg("out", "visual-diff-out"));
if (![threshold, pmThreshold, wait].every(Number.isFinite)) die("--threshold / --pm-threshold / --wait must be numbers");
const KINDS = ["click", "hover", "fill", "check", "press", "wait"];
let steps;
try { steps = JSON.parse(arg("steps", "[]")); if (!Array.isArray(steps)) throw new Error("not an array"); }
catch (e) { die(`--steps must be a JSON array (${e.message})`); }
for (const st of steps) {
  const kind = st && typeof st === "object" && !Array.isArray(st) ? KINDS.find((k) => k in st) : undefined;
  if (!kind) die(`unknown step ${JSON.stringify(st)} — kinds: ${KINDS.join(" ")}`);
  const v = st[kind];
  if (kind === "wait" ? !(Number.isFinite(v) && v >= 0) : (kind === "fill" || kind === "press")
    ? !(Array.isArray(v) && v.length === 2) : !(typeof v === "string" || (Array.isArray(v) && v.length === 2)))
    die(`malformed step ${JSON.stringify(st)}`);
}
const viewports = arg("viewports", "desktop:1200x800,mobile:375x812").split(",").map((v) => {
  const [name, d] = v.split(":"); const [w, h] = (d || "").split("x").map(Number);
  if (!name || !(w > 0) || !(h > 0)) die(`bad viewport ${JSON.stringify(v)} — want name:WxH`);
  return { name, width: w, height: h }; });
const toUrl = (s) => /^(https?|file):\/\//.test(s) ? s : "file://" + resolve(s);
let chromium, pixelmatch, PNG;
try { ({ chromium } = await import("playwright")); pixelmatch = (await import("pixelmatch")).default; ({ PNG } = await import("pngjs")); }
catch (e) { die(`missing deps — npm i -D playwright pixelmatch pngjs && npx playwright install chromium (${e.message})`); }
mkdirSync(outDir, { recursive: true });
const sel = (s, side) => (Array.isArray(s) ? s[side] : s);
const runSteps = async (page, side) => {
  for (const st of steps) {
    const o = { timeout: 10000 };
    if ("click" in st) await page.locator(sel(st.click, side)).first().click(o);
    else if ("hover" in st) await page.locator(sel(st.hover, side)).first().hover(o);
    else if ("fill" in st) await page.locator(sel(st.fill[0], side)).first().fill(st.fill[1], o);
    else if ("check" in st) await page.locator(sel(st.check, side)).first().check(o);
    else if ("press" in st) await page.locator(sel(st.press[0], side)).first().press(st.press[1], o);
    else await page.waitForTimeout(st.wait);
  }
};
const load = async (page, url) => { await page.goto(url, { waitUntil: "networkidle" }).catch(() => page.goto(url)); await page.evaluate(() => document.fonts.ready); };
const shoot = async (page, url, file, vp, side) => {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await load(page, url);
  if (fullPage) {
    await page.evaluate(async () => {
      const step = Math.max(200, innerHeight / 2);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 60)); }
      scrollTo({ top: 0, behavior: "instant" });
    });
  }
  if (wait) await page.waitForTimeout(wait);
  await runSteps(page, side);
  await page.screenshot({ path: file, fullPage, animations: "disabled" }); };
// Pad to w×h; `fill` differs per side so padded areas never compare equal to each other.
const pad = (img, w, h, fill) => { if (img.width === w && img.height === h) return img;
  const o = new PNG({ width: w, height: h });
  for (let i = 0; i < o.data.length; i += 4) o.data.set(fill, i);
  PNG.bitblt(img, o, 0, 0, img.width, img.height, 0, 0); return o; };
const browser = await chromium.launch(); const results = [];
try {
  if (expect) {
    const page = await browser.newPage(); await load(page, toUrl(candidate));
    const text = (await page.evaluate(() => document.body?.textContent || "")).toLowerCase();
    if (!text.includes(expect.toLowerCase())) die(`candidate ${candidate} does not contain --expect text ${JSON.stringify(expect)} — wrong app/port or a broken build`);
    await page.close();
  }
  for (const vp of viewports) {
    const page = await browser.newPage();
    const t = `${outDir}/${vp.name}-target.png`, c = `${outDir}/${vp.name}-candidate.png`, df = `${outDir}/${vp.name}-diff.png`;
    await shoot(page, toUrl(target), t, vp, 0); await shoot(page, toUrl(candidate), c, vp, 1); await page.close();
    const ra = PNG.sync.read(readFileSync(t)), rb = PNG.sync.read(readFileSync(c));
    const width = Math.max(ra.width, rb.width), height = Math.max(ra.height, rb.height);
    const a = pad(ra, width, height, [255, 0, 255, 255]), b = pad(rb, width, height, [0, 255, 0, 255]);
    const diff = new PNG({ width, height });
    const px = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: pmThreshold, includeAA });
    writeFileSync(df, PNG.sync.write(diff));
    // Worst band of one viewport height (pixelmatch paints mismatches pure red in `diff`). Every band is
    // full height — the last is anchored to the page bottom — so a sliver band can't inflate the %.
    let band = 0;
    for (let y = 0; y < height; y += vp.height) {
      const y0 = Math.max(0, Math.min(y, height - vp.height)), y1 = Math.min(height, y0 + vp.height); let n = 0;
      for (let i = y0 * width * 4; i < y1 * width * 4; i += 4) if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) n++;
      band = Math.max(band, (n / ((y1 - y0) * width)) * 100);
    }
    const drift = (px / (width * height)) * 100, gated = fullPage ? Math.max(drift, band) : drift;
    results.push({ viewport: vp.name, driftPct: +gated.toFixed(3), pageDriftPct: +drift.toFixed(3), worstBandPct: +band.toFixed(3),
      targetH: ra.height, candidateH: rb.height, diff: df });
    console.error(`visual-diff: ${vp.name} drift ${gated.toFixed(3)}% (page ${drift.toFixed(3)}%, worst band ${band.toFixed(3)}%, h ${ra.height} vs ${rb.height}) → ${df}`);
  }
} catch (e) { await browser.close().catch(() => {}); die(`infra error: ${e.message.split("\n")[0]}`); }
await browser.close();
const maxDrift = Math.max(...results.map((r) => r.driftPct)); const pass = maxDrift <= threshold;
writeFileSync(`${outDir}/summary.json`, JSON.stringify({ target, candidate, threshold, maxDrift, pass, results }, null, 2));
console.error(`visual-diff: MAX ${maxDrift.toFixed(3)}% vs ${threshold}% → ${pass ? "MATCH" : "MISMATCH"}`);
console.log(maxDrift.toFixed(3)); process.exit(pass ? 0 : 1);
