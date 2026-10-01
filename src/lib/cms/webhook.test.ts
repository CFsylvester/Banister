import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { judgeWebhook } from "./webhook.ts";

// Test-only secret generated per run (never a literal in source).
const key = randomBytes(16).toString("hex");
const base = { secretHeader: key, expectedSecret: key, expectedEnv: "master" };
const body = (env?: string) => JSON.stringify(env ? { sys: { id: "x", environment: { sys: { id: env } } } } : { sys: { id: "x" } });

test("a correct secret for the live environment revalidates", () => {
  assert.deepEqual(judgeWebhook({ ...base, rawBody: body("master") }), { action: "revalidate" });
});

test("no environment in the payload: the secret alone decides", () => {
  assert.equal(judgeWebhook({ ...base, rawBody: body() }).action, "revalidate");
  assert.equal(judgeWebhook({ ...base, rawBody: "not json" }).action, "revalidate");
});

test("a publish in another environment (e.g. a sandbox) is ignored, not an error", () => {
  const v = judgeWebhook({ ...base, rawBody: body("mig-001") });
  assert.equal(v.action, "ignore");
  assert.equal(v.action === "ignore" && v.status, 202);
});

test("wrong, missing or different-length secrets are rejected with 401", () => {
  const wrongSameLength = key.replace(/./, (c) => (c === "a" ? "b" : "a"));
  for (const secretHeader of [wrongSameLength, null, key.slice(0, 8), key + "x"]) {
    const v = judgeWebhook({ ...base, secretHeader, rawBody: body("master") });
    assert.equal(v.action === "reject" && v.status, 401, String(secretHeader));
  }
});

test("an unconfigured server secret is a 500, never an open endpoint", () => {
  const v = judgeWebhook({ ...base, expectedSecret: undefined, rawBody: body("master") });
  assert.equal(v.action === "reject" && v.status, 500);
});
