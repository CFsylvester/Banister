import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELD_HELP, MAX, oneLine, parseContact } from "./fields.ts";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const candidate = { audience: "candidate", first: "Jane", last: "Doe", email: "jane@firm.com", method: "Email", message: "Looking for a GC role.", usCandidate: "on" };
const employer = { audience: "employer", first: "Sam", last: "Lee", email: "sam@co.com", method: "Email", message: "Hiring a CFO.", company: "Acme" };

test("a valid candidate parses, with company ignored", () => {
  const r = parseContact(form({ ...candidate, company: "Forged" }));
  assert.deepEqual(r, { ok: true, fields: { audience: "candidate", first: "Jane", last: "Doe", email: "jane@firm.com", phone: "", method: "Email", message: "Looking for a GC role.", company: "" } });
});

test("a valid employer parses, with no US confirmation needed", () => {
  const r = parseContact(form(employer));
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.fields.company, "Acme");
});

test("an unknown or missing audience is treated as candidate, so it still needs the US confirmation", () => {
  const rest: Record<string, string> = { ...candidate, audience: "admin" };
  delete rest.usCandidate;
  assert.deepEqual(parseContact(form(rest)), { ok: false, field: "usCandidate", error: FIELD_HELP.usCandidate });
});

test("each required field is enforced", () => {
  for (const field of ["first", "last", "email", "message"] as const) {
    assert.deepEqual(parseContact(form({ ...candidate, [field]: "  " })), { ok: false, field, error: FIELD_HELP[field] });
  }
  assert.equal(parseContact(form({ ...candidate, email: "nope" })).ok, false);
  for (const email of ["a,b@x.com", "a;b@x.com", "\"a\"@x.com", "a<b@x.com"]) assert.equal(parseContact(form({ ...candidate, email })).ok, false, email);
});

test("phone is required only when it is the chosen method, and must look like a phone number", () => {
  assert.deepEqual(parseContact(form({ ...candidate, method: "Phone" })), { ok: false, field: "phone", error: FIELD_HELP.phone });
  assert.equal(parseContact(form({ ...candidate, method: "Phone", phone: "(555) 123-4567" })).ok, true);
  assert.equal(parseContact(form({ ...candidate, phone: "+1 555 123 4567 ext. 12" })).ok, true);
  assert.equal(parseContact(form({ ...candidate, phone: "12345" })).ok, false);
  assert.equal(parseContact(form({ ...candidate, phone: "call me maybe" })).ok, false);
});

test("length caps hold at the boundary", () => {
  assert.equal(parseContact(form({ ...candidate, first: "a".repeat(MAX.name) })).ok, true);
  assert.equal(parseContact(form({ ...candidate, first: "a".repeat(MAX.name + 1) })).ok, false);
  assert.equal(parseContact(form({ ...candidate, message: "m".repeat(MAX.message) })).ok, true);
  assert.equal(parseContact(form({ ...candidate, message: "m".repeat(MAX.message + 1) })).ok, false);
  assert.equal(parseContact(form({ ...employer, company: "c".repeat(MAX.company + 1) })).ok, false);
});

test("names lose line breaks and control characters; the message keeps its line breaks", () => {
  const r = parseContact(form({ ...candidate, first: "Ja\r\nne\u0007", message: "Line one\nLine two\u0000" }));
  assert.equal(r.ok && r.fields.first, "Ja ne");
  assert.equal(r.ok && r.fields.message, "Line one\nLine two");
  assert.equal(oneLine("  a\t\tb \n c "), "a b c");
});
