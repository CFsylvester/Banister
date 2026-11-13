import { test } from "node:test";
import assert from "node:assert/strict";
import { absUrl, postalAddress } from "./seo.ts";

test("parses the owner-supplied address into a PostalAddress", () => {
  assert.deepEqual(postalAddress("4422 N Ravenswood Ave, Chicago, IL 60640, United States"), {
    "@type": "PostalAddress", streetAddress: "4422 N Ravenswood Ave", addressLocality: "Chicago", addressRegion: "IL", postalCode: "60640", addressCountry: "US",
  });
});

// The review finding this guards: the address used to be split at import time, so any other shape threw on every page.
test("omits the address, never throws, for a blank or any other shape", () => {
  for (const raw of ["[POSTAL ADDRESS]", "", "4422 N Ravenswood Ave, Suite 2, Chicago, IL 60640, United States", "Chicago"]) {
    assert.equal(postalAddress(raw), undefined);
  }
});

test("absolute URLs carry the trailing slash the site serves", () => {
  assert.equal(absUrl("/"), "https://banisterintus.com/");
  assert.equal(absUrl("/services"), "https://banisterintus.com/services/");
  assert.equal(absUrl("/insights/state-of-talent-acquisition/"), "https://banisterintus.com/insights/state-of-talent-acquisition/");
});


// Re-audit finding (2026-11-13): /industries/ shipped a 157-character description that review missed. Reads the source
// rather than importing pages (they pull in React components that `node --test` can't load). Meta descriptions are the
// pageMetadata() ones (always followed by `path:`) and the layout's fallback — not the JSON-LD `description`s.
test("every page description is 155 characters or fewer", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const files = (await readdir("src", { recursive: true })).filter((f) => /(^|\/)(page\.tsx|seo\.ts|layout\.tsx)$/.test(f));
  const found: [string, string][] = [];
  for (const f of files) {
    for (const m of (await readFile(`src/${f}`, "utf8")).matchAll(/description: "([^"]+)",\s*(?:path:|openGraph:)/g)) found.push([f, m[1]]);
  }
  assert.ok(found.length >= 8, `expected the page descriptions, found ${found.length}`);
  for (const [f, d] of found) assert.ok(d.length <= 155, `${f}: ${d.length} characters — "${d}"`);
});
