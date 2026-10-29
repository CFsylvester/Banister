import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createEzekiaClient, parseRetryAfter, EZEKIA_BASE_URL } from "./client.ts";
import {
  EzekiaAuthError, EzekiaConflictError, EzekiaError, EzekiaNotFoundError, EzekiaRateLimitError, EzekiaUpstreamError, EzekiaValidationError,
} from "./errors.ts";

// Test-only token generated per run (never a literal in source).
const token = randomBytes(16).toString("hex");
type Seen = { url: string; init: RequestInit };
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

/** A client whose fetch replays `responses` in order and whose sleep only records waits. */
function harness(responses: Array<Response | Error>, extra: { maxRetryWaitMs?: number; now?: () => number } = {}) {
  const seen: Seen[] = [], waits: number[] = [], warnings: string[] = [], logs: unknown[] = [];
  const client = createEzekiaClient({
    token,
    fetch: async (url, init) => {
      seen.push({ url: String(url), init: init ?? {} });
      const next = responses.shift();
      if (!next) throw new Error("test: unexpected extra request");
      if (next instanceof Error) throw next;
      return next;
    },
    sleep: async (ms) => { waits.push(ms); },
    warn: (m) => warnings.push(m),
    log: (e) => logs.push(e),
    ...extra,
  });
  return { client, seen, waits, warnings, logs };
}
const header = (s: Seen, k: string) => new Headers(s.init.headers).get(k);

test("JSON calls send bearer + Accept + JSON Content-Type; multipart leaves Content-Type to fetch", async () => {
  const h = harness([json(200, { id: 1, email: "api@x", fullName: "API User" }), json(200, { id: 9 })]);
  assert.equal((await h.client.me()).fullName, "API User");
  await h.client.addDocument(5, new Blob(["%PDF-1.7"], { type: "application/pdf" }), "cv.pdf");
  const [me, doc] = h.seen;
  assert.equal(me.url, `${EZEKIA_BASE_URL}/me`);
  assert.equal(header(me, "authorization"), `Bearer ${token}`);
  assert.equal(header(me, "accept"), "application/json");
  assert.equal(header(me, "content-type"), "application/json");
  assert.equal(doc.url, `${EZEKIA_BASE_URL}/people/5/documents`);
  assert.equal(header(doc, "content-type"), null);
  assert.ok(doc.init.body instanceof FormData && (doc.init.body.get("files[]") as File).name === "cv.pdf");
});

test("createPersonFromCv sends a multipart `resume` plus only the options given", async () => {
  const h = harness([json(200, { data: { id: 42 } })]);
  const p = await h.client.createPersonFromCv(new Blob(["x"]), "cv-smith.pdf", { lists: [3, 4], projectId: 7, projectType: "assignment" });
  assert.equal(p.id, 42);
  const form = h.seen[0].init.body as FormData;
  assert.equal(h.seen[0].init.method, "POST");
  assert.equal((form.get("resume") as File).name, "cv-smith.pdf");
  assert.deepEqual(form.getAll("lists[]"), ["3", "4"]);
  assert.equal(form.get("projectId"), "7");
  assert.equal(form.get("ownerId"), null);
});

test("updatePersonNames PUTs only first and last name — never emails or phones", async () => {
  const h = harness([json(200, { data: { id: 8 } })]);
  await h.client.updatePersonNames(8, { firstName: "Ada", lastName: "Lovelace" });
  assert.equal(h.seen[0].init.method, "PUT");
  assert.deepEqual(JSON.parse(String(h.seen[0].init.body)), { firstName: "Ada", lastName: "Lovelace" });
});

test("findPeopleByEmail queries by email and keeps exact case-insensitive matches, newest first", async () => {
  const h = harness([json(200, { data: [
    { id: 1, updatedAt: "2026-01-01", emails: [{ id: 1, address: "ADA@example.com" }] },
    { id: 2, updatedAt: "2026-05-01", emails: [{ id: 2, address: "ada@example.com " }] },
    { id: 3, updatedAt: "2026-09-01", emails: [{ id: 3, address: "ada@example.co" }] }, // looser server match: dropped
    { id: 4, updatedAt: "2026-09-02" },
  ], links: {}, meta: {} })]);
  const people = await h.client.findPeopleByEmail(" Ada@Example.com");
  assert.deepEqual(people.map((p) => p.id), [2, 1]);
  const url = new URL(h.seen[0].url);
  assert.equal(url.searchParams.get("query"), "Ada@Example.com");
  assert.deepEqual(url.searchParams.getAll("filterOn[]"), ["email"]);
});

test("each error status maps to its typed error; 422 keeps the field errors", async () => {
  const cases: Array<[Response, new (...a: never[]) => Error]> = [
    [json(401, { message: "Unauthenticated." }), EzekiaAuthError],
    [json(403, {}), EzekiaAuthError],
    [json(404, {}), EzekiaNotFoundError],
    [json(409, {}), EzekiaConflictError],
    [json(422, { message: "bad", errors: { email: ["taken"] } }), EzekiaValidationError],
  ];
  for (const [res, Type] of cases) {
    const h = harness([res]);
    await assert.rejects(h.client.me(), (e: unknown) => {
      assert.ok(e instanceof Type, `${res.status} → ${(e as Error).name}`);
      assert.ok(!(e as Error).message.includes(token));
      return true;
    });
  }
  const h = harness([json(422, { message: "bad", errors: { email: ["taken"] } })]);
  await assert.rejects(h.client.me(), (e: unknown) => e instanceof EzekiaValidationError && "email" in e.errors && !e.message.includes("taken"));
});

test("a 429 waits Retry-After seconds and then succeeds", async () => {
  const h = harness([json(429, {}, { "retry-after": "2" }), json(200, { id: 1 })]);
  await h.client.me();
  assert.deepEqual(h.waits, [2000]);
  assert.equal(h.seen.length, 2);
});

test("a 429 with an HTTP-date Retry-After waits until that date", async () => {
  const t0 = Date.parse("2026-10-29T12:00:00Z");
  const h = harness([json(429, {}, { "retry-after": "Thu, 29 Oct 2026 12:00:03 GMT" }), json(200, { id: 1 })], { now: () => t0 });
  await h.client.me();
  assert.deepEqual(h.waits, [3000]);
});

test("429 retries stop after 3, or sooner when the total wait would pass the cap", async () => {
  const many = () => Array.from({ length: 5 }, () => json(429, {}, { "retry-after": "1" }));
  const h = harness(many());
  await assert.rejects(h.client.me(), (e: unknown) => e instanceof EzekiaRateLimitError && e.retryAfterMs === 1000);
  assert.deepEqual(h.waits, [1000, 1000, 1000]);

  const capped = harness([json(429, {}, { "retry-after": "8" }), json(429, {}, { "retry-after": "8" })], { maxRetryWaitMs: 10_000 });
  await assert.rejects(capped.client.me(), EzekiaRateLimitError);
  assert.deepEqual(capped.waits, [8000]); // a second 8 s wait would pass 10 s
});

const netError = (code?: string) => Object.assign(new TypeError("fetch failed"), { cause: code ? Object.assign(new Error(code), { code }) : undefined });

test("GET/PUT: a 5xx or network error is retried once after 500 ms, then surfaces as EzekiaUpstreamError", async () => {
  const ok = harness([json(502, {}), json(200, { id: 1 })]);
  await ok.client.me();
  assert.deepEqual(ok.waits, [500]);
  const netOk = harness([netError("ECONNRESET"), json(200, { data: { id: 8 } })]);
  await netOk.client.updatePersonNames(8, { firstName: "A", lastName: "B" });
  assert.equal(netOk.seen.length, 2);
  const twice = harness([json(500, {}), json(500, {})]);
  await assert.rejects(twice.client.me(), (e: unknown) => e instanceof EzekiaUpstreamError && e.status === 500);
  const down = harness([netError(), json(503, {})]); // one shared retry, never two
  await assert.rejects(down.client.me(), (e: unknown) => e instanceof EzekiaUpstreamError && e.status === 503);
});

test("POST is not resent when Ezekia may already have acted: 502/504, a reset or a timeout", async () => {
  for (const failure of [json(502, {}), json(504, {}), netError("ECONNRESET"), Object.assign(new DOMException("timed out", "TimeoutError"))]) {
    const h = harness([failure]);
    await assert.rejects(h.client.addNote([1], "hi"), EzekiaUpstreamError);
    assert.equal(h.seen.length, 1, `no resend after ${failure instanceof Response ? failure.status : (failure as Error).name}`);
  }
});

test("POST is resent once when the request certainly didn't land: 503 or a refused connection", async () => {
  for (const failure of [json(503, {}), netError("ECONNREFUSED"), netError("ENOTFOUND")]) {
    const h = harness([failure, json(200, { updated: [1], notUpdated: [] })]);
    await h.client.addNote([1], "hi");
    assert.equal(h.seen.length, 2);
  }
});

test("a network failure keeps the original error as cause; its message stays generic", async () => {
  const h = harness([netError("ECONNRESET")]);
  await assert.rejects(h.client.addNote([1], "secret note"), (e: unknown) =>
    e instanceof EzekiaUpstreamError && (e.cause as TypeError).cause !== undefined && !e.message.includes("secret"));
});

test("every attempt carries a timeout signal", async () => {
  const h = harness([json(200, { id: 1 })]);
  await h.client.me();
  assert.ok(h.seen[0].init.signal instanceof AbortSignal);
});

test("2xx bodies: 204 → undefined; empty 200 or non-JSON → EzekiaError without echoing the body", async () => {
  const empty = harness([new Response(null, { status: 204 })]);
  assert.equal(await empty.client.me(), undefined);
  const blank = harness([new Response("", { status: 200 })]);
  await assert.rejects(blank.client.createPersonFromCv(new Blob(["x"]), "cv.pdf"), (e: unknown) =>
    e instanceof EzekiaError && /empty response/.test(e.message));
  const html = harness([new Response("<html>Jane Doe</html>", { status: 200 })]);
  await assert.rejects(html.client.me(), (e: unknown) => e instanceof EzekiaError && !(e instanceof EzekiaUpstreamError) && !e.message.includes("Jane"));
});

test("an unmapped status falls back to a plain EzekiaError", async () => {
  const h = harness([json(400, {})]);
  await assert.rejects(h.client.me(), (e: unknown) => e instanceof EzekiaError && e.name === "EzekiaError" && e.status === 400);
});

test("path ids must be positive integers", async () => {
  const h = harness([]);
  for (const bad of [NaN, 0, -1, 1.5]) await assert.rejects(h.client.addPhone(bad, "1"), /positive integer id/);
  assert.equal(h.seen.length, 0);
});

test("a Sunset header warns once per client and does not fail the call", async () => {
  const s = { sunset: "Fri, 01 Jan 2027 00:00:00 GMT" };
  const h = harness([json(200, { id: 1 }, s), json(200, { id: 1 }, s)]);
  await h.client.me(); await h.client.me();
  assert.equal(h.warnings.length, 1);
  assert.match(h.warnings[0], /Sunset/);
});

test("the request log carries method, route template, status and timing only", async () => {
  const h = harness([json(200, { data: { id: 3 } })]);
  await h.client.addEmail(3, "private@example.com");
  assert.equal(JSON.stringify(h.logs).includes("private@example.com"), false);
  assert.deepEqual(Object.keys(h.logs[0] as object).sort(), ["method", "ms", "route", "status"]);
  assert.equal((h.logs[0] as { route: string }).route, "/people/{id}/emails");
});

test("parseRetryAfter: seconds, IMF-fixdate, past date → 0; anything else → null", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  assert.equal(parseRetryAfter("5", now), 5000);
  assert.equal(parseRetryAfter("0", now), 0);
  assert.equal(parseRetryAfter("Thu, 29 Oct 2026 12:00:10 GMT", now), 10_000);
  assert.equal(parseRetryAfter("Thu, 29 Oct 2026 11:00:00 GMT", now), 0);
  for (const junk of ["soon", "1.5", "-1", "120s", "2026-10-29"]) assert.equal(parseRetryAfter(junk, now), null, junk);
  assert.equal(parseRetryAfter(null, now), null);
});

test("429 waits: no Retry-After → 1000 ms; Retry-After 0 → the 200 ms floor", async () => {
  const none = harness([json(429, {}), json(200, { id: 1 })]);
  await none.client.me();
  assert.deepEqual(none.waits, [1000]);
  const zero = harness([json(429, {}, { "retry-after": "0" }), json(200, { id: 1 })]);
  await zero.client.me();
  assert.deepEqual(zero.waits, [200]);
});

test("a missing token fails fast with a clear message", () => {
  assert.throws(() => createEzekiaClient({ token: "" }), /EZEKIA_API_TOKEN/);
});

test("a multipart body is re-sent in full on retry (real HTTP server, real fetch)", async () => {
  const { createServer } = await import("node:http");
  const bodies: string[] = [];
  const server = createServer((req, res) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
      bodies.push(b);
      res.writeHead(bodies.length === 1 ? 429 : 200, { "content-type": "application/json", "retry-after": "0" });
      res.end(bodies.length === 1 ? "{}" : JSON.stringify({ id: 7 }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    const { port } = server.address() as { port: number };
    const client = createEzekiaClient({ token, baseUrl: `http://127.0.0.1:${port}`, sleep: async () => {} });
    await client.addDocument(7, new Blob(["%PDF-1.7 unique-marker"]), "cv.pdf");
    assert.equal(bodies.length, 2);
    for (const b of bodies) assert.ok(b.includes("unique-marker") && b.includes('name="files[]"'));
  } finally { server.close(); }
});

test("a body that stalls after the headers → EzekiaUpstreamError, not resent (real HTTP server)", async () => {
  const { createServer } = await import("node:http");
  let hits = 0;
  const server = createServer((_req, res) => {
    hits++;
    res.writeHead(200, { "content-type": "application/json" });
    res.write('{"data":'); // never finishes
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    const { port } = server.address() as { port: number };
    const client = createEzekiaClient({ token, baseUrl: `http://127.0.0.1:${port}`, sleep: async () => {}, timeoutMs: 150 });
    await assert.rejects(client.updatePersonNames(3, { firstName: "A", lastName: "B" }), (e: unknown) =>
      e instanceof EzekiaUpstreamError && e.status === 200);
    assert.equal(hits, 1);
  } finally { server.closeAllConnections(); server.close(); }
});
