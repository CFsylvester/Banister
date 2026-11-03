import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { EzekiaError } from "./ezekia/errors.ts";
import { HONEYPOT_FIELD, EMAIL_HELP } from "./signup.ts";
import { createSignupGuard, handleSubscribe, RATE_LIMITED, type SubscribeDeps } from "./subscribe-handler.ts";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const signup = form({ email: "jane@firm.com" });

function harness(t: TestContext, overrides: Partial<SubscribeDeps> = {}) {
  for (const m of ["info", "warn", "error"] as const) t.mock.method(console, m, () => {});
  const added: string[] = [];
  const guarded: string[] = [];
  const deps: SubscribeDeps = {
    ipKey: async () => "203.0.113.7",
    guard: (ip) => { guarded.push(ip); return null; },
    addToList: async (email) => { added.push(email); },
    ...overrides,
  };
  return { deps, added, guarded };
}

test("a valid sign-up passes the guard with the client's key and reaches Ezekia", async (t) => {
  const { deps, added, guarded } = harness(t);
  assert.deepEqual(await handleSubscribe(signup, deps), { ok: true });
  assert.deepEqual(added, ["jane@firm.com"]);
  assert.deepEqual(guarded, ["203.0.113.7"]);
});

test("a refused request gets the friendly error for its reason and spends no Ezekia calls", async (t) => {
  for (const reason of ["ip", "instance"] as const) {
    const { deps, added } = harness(t, { guard: () => reason });
    assert.deepEqual(await handleSubscribe(signup, deps), { ok: false, error: RATE_LIMITED[reason] });
    assert.deepEqual(added, []);
  }
});

test("honeypot hits and invalid emails are not counted against the limit", async (t) => {
  const { deps, added, guarded } = harness(t);
  assert.deepEqual(await handleSubscribe(form({ email: "jane@firm.com", [HONEYPOT_FIELD]: "x" }), deps), { ok: true });
  assert.deepEqual(await handleSubscribe(form({ email: "nope" }), deps), { ok: false, error: EMAIL_HELP });
  assert.deepEqual(guarded, []);
  assert.deepEqual(added, []);
});

test("a concurrent burst: one gets through, the rest are rejected and never reach Ezekia", async (t) => {
  const { deps, added } = harness(t, { guard: createSignupGuard(() => 0) });
  const results = await Promise.all(Array.from({ length: 8 }, () => handleSubscribe(signup, deps)));
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.deepEqual(results.filter((r) => !r.ok), Array(7).fill({ ok: false, error: RATE_LIMITED.instance }));
  assert.equal(added.length, 1);
});

test("a paced burst from one address: the first 5 get through, then the address is refused", async (t) => {
  let now = 0;
  const { deps, added } = harness(t, { guard: createSignupGuard(() => (now += 1_000)) });
  const results = [];
  for (let i = 0; i < 7; i++) results.push(await handleSubscribe(signup, deps));
  assert.equal(results.filter((r) => r.ok).length, 5);
  assert.deepEqual(results.slice(5), Array(2).fill({ ok: false, error: RATE_LIMITED.ip }));
  assert.equal(added.length, 5);
});

test("Ezekia failures keep the generic message and never log the email", async (t) => {
  const failures: [Error, string][] = [
    [new EzekiaError("POST /people", 503), "subscribe: Ezekia POST /people → 503"],
    [new Error("jane@firm.com rejected"), "subscribe: unexpected Error"],
  ];
  for (const [err, expected] of failures) {
    t.mock.restoreAll();
    const { deps } = harness(t, { addToList: async () => { throw err; } });
    const res = await handleSubscribe(signup, deps);
    assert.equal(res.ok, false);
    assert.notEqual(!res.ok && res.error, RATE_LIMITED);
    const logged = (console.error as unknown as { mock: { calls: { arguments: unknown[] }[] } }).mock.calls[0].arguments.join(" ");
    assert.equal(logged, expected);
  }
});

test("guard: one address is cut off after 5 in 10 minutes, then let back in", () => {
  let now = 0;
  const guard = createSignupGuard(() => now);
  for (let i = 0; i < 5; i++, now += 1_000) assert.equal(guard("a"), null);
  assert.equal(guard("a"), "ip");
  assert.equal(guard("b"), null, "other addresses are unaffected");
  now = 10 * 60_000;
  assert.equal(guard("a"), null);
});

test("guard: one sign-up a second across all addresses", () => {
  let now = 0;
  const guard = createSignupGuard(() => now);
  assert.equal(guard("a"), null);
  assert.equal(guard("b"), "instance");
  now = 999;
  assert.equal(guard("b"), "instance");
  now = 1_000;
  assert.equal(guard("b"), null);
});

test("guard: 20 a minute across all addresses, even when each stays under its own limit", () => {
  let now = 0;
  const guard = createSignupGuard(() => now);
  for (let i = 0; i < 20; i++, now += 1_000) assert.equal(guard(`ip${i}`), null);
  assert.equal(guard("ip-new"), "instance");
  now = 60_000;
  assert.equal(guard("ip-new"), null);
});

test("guard: an address over its own limit doesn't use up the shared caps", () => {
  let now = 0;
  const guard = createSignupGuard(() => now);
  for (let i = 0; i < 100; i++, now += 100) guard("noisy");
  now = 60_000; // a new minute: the noisy address is still refused, and every other sign-up still fits
  for (let i = 0; i < 20; i++, now += 1_000) assert.equal(guard(`ip${i}`), null);
});

test("guard: a shared-cap refusal doesn't use up the visitor's own limit", () => {
  let now = 0;
  const guard = createSignupGuard(() => now);
  guard("other");
  for (let i = 0; i < 10; i++) assert.equal(guard("visitor"), "instance");
  now = 1_000;
  assert.equal(guard("visitor"), null);
});
