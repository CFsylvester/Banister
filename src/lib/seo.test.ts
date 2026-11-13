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

