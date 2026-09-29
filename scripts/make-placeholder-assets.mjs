#!/usr/bin/env node
// make-placeholder-assets.mjs — writes a patterned placeholder for every image the design references, at the
// same paths, so the target render and the Next.js build lay out identically until the real exports land.
// Dimensions are guesses [assumption]: the real assets were not supplied. Replace public/assets/* with the real
// files (same names) and re-run the visual gate. Existing files are never overwritten.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";

const out = resolve("public/assets");
mkdirSync(out, { recursive: true });

const photos = [
  "hero-tablet", "insight-greeting", "insight-tablet", "services-review", "industries-laptop", "about-atrium",
  "article-hero", "operations", "insight-whiteboard", "insight-hardhats", "handshake-city", "duffy-alliance",
  "hero-handshake", "team-meeting", "patrick-sylvester", "tammie-do", "brian-haugh", "james-mcmahon",
].map((n) => [`${n}.jpg`, 1600, 1000]);
const industries = ["aerospace", "building-products", "construction", "consumer", "education", "financial", "food",
  "hospitality", "insurance", "consulting", "manufacturing", "private-equity", "sport", "technology"];
const files = [
  ...photos,
  ["banister-logo-white.png", 416, 104],
  ...["quality", "execution", "speed", "insights"].map((n) => [`hex-${n}.png`, 440, 440]),
  ...industries.map((n) => [`icon-${n}.png`, 104, 104]),
  ...["linkedin", "email", "phone"].map((n) => [`icon-${n}.png`, 88, 88]),
];

// Deterministic per-name colour + a 40px grid so a misplaced crop/offset shows up in the pixel diff.
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
for (const [name, w, h] of files) {
  const path = `${out}/${name}`;
  if (existsSync(path)) continue;
  const png = new PNG({ width: w, height: h });
  const seed = hue(name), r = 60 + (seed % 150), g = 60 + ((seed >> 8) % 150), b = 60 + ((seed >> 16) % 150);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (w * y + x) << 2, line = x % 40 === 0 || y % 40 === 0;
    png.data[i] = line ? 255 : r; png.data[i + 1] = line ? 255 : g; png.data[i + 2] = line ? 255 : b; png.data[i + 3] = 255;
  }
  writeFileSync(path, PNG.sync.write(png));
  console.log(`placeholder ${name} ${w}x${h}`);
}
