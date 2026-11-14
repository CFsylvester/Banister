import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { EzekiaUpstreamError } from "../ezekia/errors.ts";
import { FIELD_HELP } from "./fields.ts";
import { CONTACT_ERROR, CONTACT_HONEYPOT, handleContact, type ContactDeps } from "./handler.ts";
import { RESUME_HELP } from "./resume.ts";

const form = (fields: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const candidate = { audience: "candidate", first: "Jane", last: "Doe", email: "jane@firm.com", method: "Email", message: "Hello", usCandidate: "on" };
const employer = { audience: "employer", first: "Sam", last: "Lee", email: "sam@co.com", method: "Email", message: "Hiring", company: "Acme" };
const pdf = new File([new TextEncoder().encode("%PDF-1.7 body")], "cv.pdf");

function harness(t: TestContext, overrides: Partial<ContactDeps> = {}) {
  const logs: string[] = [];
  for (const m of ["info", "warn", "error"] as const) t.mock.method(console, m, (s: string) => { logs.push(s); });
  const recorded: unknown[][] = [];
  const emailed: unknown[] = [];
  const guarded: string[] = [];
  const deps: ContactDeps = {
    ipKey: async () => "203.0.113.7",
    guard: (ip) => { guarded.push(ip); return null; },
    isBot: async () => false,
    inUs: async () => true,
    record: async (f, r) => { recorded.push([f, r]); },
    emailConfig: () => ({ to: "team@banisterintus.com", from: "website@banisterintus.com" }),
    emailEmployer: async (_c, f) => { emailed.push(f); return true; },
    ...overrides,
  };
  return { deps, recorded, emailed, guarded, logs };
}

test("a candidate with a résumé is recorded with the checked file, and nothing is emailed", async (t) => {
  const h = harness(t);
  assert.deepEqual(await handleContact(form({ ...candidate, resume: pdf }), h.deps), { ok: true });
  assert.equal(h.recorded.length, 1);
  assert.equal((h.recorded[0][1] as { kind: string }).kind, "pdf");
  assert.deepEqual(h.emailed, []);
  assert.deepEqual(h.guarded, ["203.0.113.7"]);
});

test("an employer is recorded and then emailed; a forged résumé is ignored", async (t) => {
  const h = harness(t);
  assert.deepEqual(await handleContact(form({ ...employer, resume: pdf }), h.deps), { ok: true });
  assert.equal(h.recorded[0][1], null);
  assert.equal(h.emailed.length, 1);
});

test("the honeypot gets a fake success with no record; a bot verdict gets an error, never a fake success", async (t) => {
  const h = harness(t);
  assert.deepEqual(await handleContact(form({ ...candidate, [CONTACT_HONEYPOT]: "x" }), h.deps), { ok: true });
  const bot = harness(t, { isBot: async () => true });
  assert.deepEqual(await handleContact(form(candidate), bot.deps), { ok: false, error: CONTACT_ERROR.bot });
  assert.deepEqual([...h.recorded, ...bot.recorded, ...h.guarded, ...bot.guarded], []);
});

test("invalid fields and a bad résumé are refused before the rate limit and before Ezekia", async (t) => {
  const h = harness(t);
  assert.deepEqual(await handleContact(form({ ...candidate, email: "nope" }), h.deps), { ok: false, error: FIELD_HELP.email, field: "email" });
  const exe = new File([new TextEncoder().encode("MZ\x90\x00")], "cv.pdf");
  assert.deepEqual(await handleContact(form({ ...candidate, resume: exe }), h.deps), { ok: false, error: RESUME_HELP, field: "resume" });
  assert.deepEqual([...h.recorded, ...h.guarded], []);
});

test("a candidate outside the US is refused on the server; an employer outside the US is not", async (t) => {
  const h = harness(t, { inUs: async () => false });
  assert.deepEqual(await handleContact(form(candidate), h.deps), { ok: false, error: CONTACT_ERROR.notUs });
  assert.deepEqual(await handleContact(form(employer), h.deps), { ok: true });
  assert.equal(h.recorded.length, 1);
});

test("rate-limited requests get the message for their reason and reach nothing", async (t) => {
  for (const reason of ["ip", "instance"] as const) {
    const h = harness(t, { guard: () => reason });
    assert.deepEqual(await handleContact(form(employer), h.deps), { ok: false, error: CONTACT_ERROR[reason] });
    assert.deepEqual([...h.recorded, ...h.emailed], []);
  }
});

test("an employer enquiry with no email config is refused before anything is recorded", async (t) => {
  const h = harness(t, { emailConfig: () => null });
  assert.deepEqual(await handleContact(form(employer), h.deps), { ok: false, error: CONTACT_ERROR.generic });
  assert.deepEqual(h.recorded, []);
});

test("an Ezekia failure or an email failure shows the error, never success", async (t) => {
  const down = harness(t, { record: async () => { throw new EzekiaUpstreamError("GET /people", 503); } });
  assert.deepEqual(await handleContact(form(candidate), down.deps), { ok: false, error: CONTACT_ERROR.generic });
  assert.deepEqual(down.emailed, []);
  const noMail = harness(t, { emailEmployer: async () => false });
  assert.deepEqual(await handleContact(form(employer), noMail.deps), { ok: false, error: CONTACT_ERROR.generic });
  assert.equal(noMail.recorded.length, 1);
});

test("logs never contain the visitor's details", async (t) => {
  const h = harness(t, { record: async () => { throw new Error("jane@firm.com rejected"); } });
  await handleContact(form({ ...candidate, phone: "555-123-4567", message: "secret plans" }), h.deps);
  const ok = harness(t);
  await handleContact(form({ ...employer, message: "secret plans" }), ok.deps);
  for (const line of [...h.logs, ...ok.logs]) {
    for (const pii of ["jane@firm.com", "sam@co.com", "Jane", "Sam", "555", "secret plans", "Acme"]) assert.ok(!line.includes(pii), `${line} leaks ${pii}`);
  }
});
