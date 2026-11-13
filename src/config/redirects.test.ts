import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { legacyRedirects } from "./redirects.ts";
import { ARTICLE_HREF } from "../lib/content.ts";

// Resolved from this file, not the working directory, so the "must not exist" checks can't pass from the wrong folder.
const APP = resolve(import.meta.dirname, "../app"), PUBLIC = resolve(import.meta.dirname, "../../public");
const page = (path: string) => resolve(APP, "." + path, "page.tsx");
const handler = (path: string) => resolve(APP, "." + path, "route.ts");
const pathOf = (url: string) => url.split("?")[0].replace(/\/$/, "") || "/";
const isFile = (path: string) => /\.[a-z0-9]+$/.test(path);
// A destination is either a page under src/app or a file under public/.
const served = (path: string) => existsSync(page(path)) || (isFile(path) && existsSync(resolve(PUBLIC, "." + path)));
const isPattern = (source: string) => source.includes(":");
const patternPrefixes = legacyRedirects.filter((r) => isPattern(r.source)).map((r) => r.source.split("/:")[0]);

test("the app and public folders resolve (guards the negative checks below)", () => {
  assert.ok(existsSync(page("/")) && existsSync(PUBLIC));
});

test("every destination is a page or file this site serves", () => {
  for (const { destination } of legacyRedirects) assert.ok(served(pathOf(destination)), destination);
});

test("no destination is the hidden /insights listing (it 404s)", () => {
  for (const { destination } of legacyRedirects) assert.notEqual(pathOf(destination), "/insights", destination);
});

test("no literal source shadows a page, route handler or public file (redirects run before the filesystem)", () => {
  for (const { source } of legacyRedirects.filter((r) => !isPattern(r.source))) {
    assert.ok(!existsSync(page(source)) && !existsSync(handler(source)) && !existsSync(resolve(PUBLIC, "." + source)), source);
  }
});

test("no pattern source captures a route this site builds", () => {
  for (const p of patternPrefixes) assert.ok(!existsSync(resolve(APP, "." + p)), p);
});

test("sources are unique, have no trailing slash, and never chain into another redirect", () => {
  const sources = legacyRedirects.map((r) => r.source);
  assert.equal(new Set(sources).size, sources.length);
  for (const s of sources) assert.match(s, /^\/\S*[^/]$/, s);
  for (const { destination } of legacyRedirects) {
    const d = pathOf(destination);
    assert.ok(!sources.includes(d) && !patternPrefixes.some((p) => d === p || d.startsWith(p + "/")), destination);
  }
});

test("page destinations end in a slash, so trailingSlash adds no second hop", () => {
  for (const { destination } of legacyRedirects) {
    const path = destination.split("?")[0];
    if (!isFile(path)) assert.match(path, /\/$/, destination);
  }
});

test("the article URL matches the one the site links to", () => {
  assert.ok(legacyRedirects.some((r) => r.destination === `${ARTICLE_HREF}/`));
});
