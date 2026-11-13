import { test } from "node:test";
import assert from "node:assert/strict";
import { candidateFormOpen, COUNTRY_HEADER, requestCountry } from "./geo.ts";

const h = (country?: string) => new Headers(country === undefined ? {} : { [COUNTRY_HEADER]: country });

test("opens the candidate form for the US and its territories", () => {
  for (const c of ["US", "us", " US ", "PR", "GU", "VI", "AS", "MP", "UM"]) assert.equal(candidateFormOpen(h(c), ""), true, c);
});

test("shuts it everywhere else", () => {
  for (const c of ["GB", "DE", "FR", "CA", "MX", "CN", "AE"]) assert.equal(candidateFormOpen(h(c), ""), false, c);
});

test("shuts it when the country is unknown or malformed", () => {
  for (const c of [undefined, "", "XX1", "USA", "-"]) assert.equal(candidateFormOpen(h(c), ""), false, String(c));
});

test("the override stands in only when the header is missing", () => {
  assert.equal(candidateFormOpen(h(), "US"), true);
  assert.equal(candidateFormOpen(h("DE"), "US"), false);
  assert.equal(candidateFormOpen(h(""), "US"), false); // present but empty: unknown, not overridden
  assert.equal(requestCountry(h(), "gb"), "GB");
});
