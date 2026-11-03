import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_EMAIL, validEmail } from "./signup.ts";

test("accepts ordinary addresses and returns them trimmed", () => {
  for (const e of ["name@company.com", "a.b+c@sub.firm.co.uk", "x@y.io"]) assert.equal(validEmail(e), e);
  assert.equal(validEmail("  jane@firm.com \n"), "jane@firm.com");
});

test("rejects malformed addresses", () => {
  for (const e of ["", "a@b", "a@.com", "a@b..com", "a b@c.com", "a@b.c", "@firm.com", "jane@", "a@@b.com"]) {
    assert.equal(validEmail(e), null, e);
  }
});

test("rejects addresses over the RFC 5321 length cap", () => {
  const at = (n: number) => "a".repeat(n - "@firm.com".length) + "@firm.com";
  assert.equal(validEmail(at(MAX_EMAIL)), at(MAX_EMAIL));
  assert.equal(validEmail(at(MAX_EMAIL + 1)), null);
});

test("hostile 1 MB input is rejected fast (no regex backtracking blow-up)", () => {
  const hostile = ["a@" + ".".repeat(1_000_000) + " ", "a@" + "b.".repeat(500_000) + " "];
  for (const s of hostile) {
    const t = performance.now();
    assert.equal(validEmail(s), null);
    assert.ok(performance.now() - t < 50, "validation should not scan the oversize input with the regex");
  }
  // The regex itself must also stay linear on input just under the cap.
  const t = performance.now();
  validEmail("a@" + ".".repeat(MAX_EMAIL - 3) + " ");
  assert.ok(performance.now() - t < 50);
});
