import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { checkCaller, checkEnvironment, liveEnvironments, MAX_BODY_BYTES, readCapped } from "./webhook.ts";

// Test-only secret generated per run (never a literal in source).
const key = randomBytes(16).toString("hex");
const caller = (secretHeader: string | null, contentLength: string | null = "100") =>
  checkCaller({ secretHeader, expectedSecret: key, contentLength });
const body = (env?: string) => JSON.stringify(env ? { sys: { id: "x", environment: { sys: { id: env } } } } : { sys: { id: "x" } });

test("the right secret passes; wrong, missing, shorter or longer secrets get a generic 401", () => {
  assert.equal(caller(key).action, "revalidate");
  for (const s of [key.replace(/./, (c) => (c === "a" ? "b" : "a")), null, key.slice(0, 8), key + "x"]) {
    const v = caller(s);
    assert.ok(v.action === "reject" && v.status === 401 && v.reason === "unauthorized", String(s));
  }
});

test("an unconfigured server secret looks like any 401 to the caller, flagged for the server log", () => {
  const v = checkCaller({ secretHeader: key, expectedSecret: undefined, contentLength: "1" });
  assert.ok(v.action === "reject" && v.status === 401 && v.reason === "unauthorized" && v.misconfigured === true);
});

test("an oversized declared Content-Length is refused; missing or garbage lengths defer to the read cap", () => {
  const v = caller(key, String(MAX_BODY_BYTES + 1));
  assert.ok(v.action === "reject" && v.status === 413);
  assert.equal(caller(key, null).action, "revalidate");
  assert.equal(caller(key, "abc").action, "revalidate");
});

test("readCapped returns the body under the cap and null past it (chunked, no Content-Length)", async () => {
  const stream = (n: number, size: number) => new ReadableStream<Uint8Array>({
    start(c) { for (let i = 0; i < n; i++) c.enqueue(new Uint8Array(size).fill(97)); c.close(); },
  });
  assert.equal(await readCapped(stream(2, 10), 64), "a".repeat(20));
  assert.equal(await readCapped(stream(10, 10), 64), null);
  assert.equal(await readCapped(null), "");
});

test("a live-environment publish revalidates; no environment in the payload → the secret alone decides", () => {
  assert.deepEqual(checkEnvironment(body("master"), ["master"]), { action: "revalidate" });
  assert.equal(checkEnvironment(body(), ["master"]).action, "revalidate");
  assert.equal(checkEnvironment("not json", ["master"]).action, "revalidate");
});

test("a sandbox publish is ignored (202); an alias target listed as live revalidates", () => {
  const v = checkEnvironment(body("mig-001"), ["master"]);
  assert.ok(v.action === "ignore" && v.status === 202);
  const live = liveEnvironments({ LIVE_ENVIRONMENTS: "master-2026-10" });
  assert.equal(checkEnvironment(body("master-2026-10"), live).action, "revalidate");
});

test("live environments default to master and merge LIVE_ENVIRONMENTS without blanks or duplicates", () => {
  assert.deepEqual(liveEnvironments({}), ["master"]);
  assert.deepEqual(liveEnvironments({ LIVE_ENVIRONMENTS: " master-2026-10 , master,," }), ["master", "master-2026-10"]);
});
