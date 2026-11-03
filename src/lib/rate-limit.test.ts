import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIpKey, createRateLimiter } from "./rate-limit.ts";

function clock(start = 1_000) {
  const c = { t: start, now: () => c.t };
  return c;
}

function limiter(opts: { limit: number; windowMs: number; maxKeys?: number; now: () => number }) {
  const l = createRateLimiter(opts);
  return { l, allow: (key: string) => { if (l.full(key)) return false; l.hit(key); return true; } };
}

test("allows up to the limit, then is full until the window ends", () => {
  const c = clock();
  const { allow } = limiter({ limit: 2, windowMs: 100, now: c.now });
  assert.deepEqual([allow("a"), allow("a"), allow("a")], [true, true, false]);
  c.t += 99;
  assert.equal(allow("a"), false);
  c.t += 1;
  assert.equal(allow("a"), true);
});

test("full() doesn't count: checking repeatedly leaves the budget alone", () => {
  const { l } = limiter({ limit: 1, windowMs: 100, now: () => 0 });
  for (let i = 0; i < 5; i++) assert.equal(l.full("a"), false);
  l.hit("a");
  assert.equal(l.full("a"), true);
});

test("refusals don't extend the window, and keys are counted separately", () => {
  const c = clock();
  const { allow } = limiter({ limit: 1, windowMs: 100, now: c.now });
  assert.equal(allow("a"), true);
  c.t += 50;
  assert.equal(allow("a"), false);
  assert.equal(allow("b"), true);
  c.t += 50;
  assert.equal(allow("a"), true);
});

test("at maxKeys the oldest counter is dropped, and newer ones survive", () => {
  const { allow, l } = limiter({ limit: 1, windowMs: 100, maxKeys: 2, now: () => 0 });
  allow("a");
  allow("b");
  allow("c"); // full: evicts "a", the oldest
  assert.equal(l.size, 2);
  assert.equal(l.full("c"), true);
  assert.equal(l.full("b"), true);
  assert.equal(l.full("a"), false);
});

test("a key whose window restarts counts as newest for eviction", () => {
  const c = clock();
  const { allow, l } = limiter({ limit: 1, windowMs: 100, maxKeys: 2, now: c.now });
  allow("a");
  c.t += 60;
  allow("b");
  c.t += 40; // "a" expired and restarts, so "b" is now the oldest
  allow("a");
  c.t += 10;
  allow("c"); // full: evicts "b"
  assert.equal(l.full("a"), true);
  assert.equal(l.full("b"), false);
});

test("expired counters are swept when a new key arrives, well below maxKeys", () => {
  const c = clock();
  const { allow, l } = limiter({ limit: 1, windowMs: 100, now: c.now });
  for (let i = 0; i < 50; i++) allow(`k${i}`);
  c.t += 100;
  allow("new");
  assert.equal(l.size, 1);
});

test("a flood of distinct keys stays at maxKeys", () => {
  const { allow, l } = limiter({ limit: 1, windowMs: 60_000, maxKeys: 100, now: () => 0 });
  for (let i = 0; i < 200_000; i++) allow(`k${i}`);
  assert.equal(l.size, 100);
});

const key = (value: string | null) => clientIpKey({ get: (name) => (name === "x-forwarded-for" ? value : null) });

test("IPv4 clients key on the address; the first forwarded entry wins", () => {
  assert.equal(key("203.0.113.7"), "203.0.113.7");
  assert.equal(key(" 203.0.113.7, 10.0.0.1"), "203.0.113.7");
});

test("IPv6 clients key on their /64, so rotating within it doesn't escape the limit", () => {
  assert.equal(key("2001:db8:1:2:aaaa::1"), "2001:db8:1:2::/64");
  assert.equal(key("2001:0DB8:0001:0002:ffff:ffff:ffff:ffff"), "2001:db8:1:2::/64");
  assert.equal(key("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(key("::1"), "0:0:0:0::/64");
  assert.equal(key("fe80::1%en0"), "fe80:0:0:0::/64");
  assert.notEqual(key("2001:db8:1:2::1"), key("2001:db8:1:3::1"));
});

test("IPv4-mapped IPv6 keys on the IPv4 address, not on a /64 every mapped client would share", () => {
  assert.equal(key("::ffff:203.0.113.7"), "203.0.113.7");
  assert.notEqual(key("::ffff:cb00:7107"), key("::ffff:cb00:7108"));
});

test("a missing or malformed IP falls back to one shared key, so hostile headers can't become long keys", () => {
  for (const v of [null, "", "not-an-ip", "1.2.3.4:5678", "[2001:db8::1]:443", "zz:zz:zz:zz", "::ffff:", "a".repeat(16_000)]) {
    assert.equal(key(v), "unknown", String(v).slice(0, 20));
  }
});
