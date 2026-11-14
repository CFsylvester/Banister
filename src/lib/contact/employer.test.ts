import { test } from "node:test";
import assert from "node:assert/strict";
import type { EmailMessage } from "../email/types.ts";
import { emailConfig, emailEmployer, employerSubject, idempotencyKey } from "./employer.ts";
import type { ContactFields } from "./fields.ts";

const employer: ContactFields = { audience: "employer", first: "Sam", last: "Lee", email: "Sam@Co.com", phone: "", method: "Email", message: "Hiring a CFO.\nUrgent.", company: "Acme" };
const config = { to: "team@banisterintus.com", from: "Banister website <website@banisterintus.com>" };

test("the enquiry goes to the configured inbox, replies go to the employer, and every field is in the text", async () => {
  const sent: EmailMessage[] = [];
  assert.equal(await emailEmployer(async (m) => { sent.push(m); return { ok: true }; }, config, employer), true);
  assert.equal(sent.length, 1);
  const m = sent[0];
  assert.equal(m.to, config.to);
  assert.equal(m.from, config.from);
  assert.equal(m.replyTo, "Sam@Co.com");
  assert.equal(m.subject, "Website enquiry — Acme — Sam Lee");
  for (const s of ["Name: Sam Lee", "Company: Acme", "Email: Sam@Co.com", "Phone: not given", "Preferred contact: Email", "Message:\nHiring a CFO.\nUrgent."]) {
    assert.ok(m.text.includes(s), s);
  }
});

test("a retry sends a byte-identical message under the same key", async () => {
  const sent: EmailMessage[] = [];
  const send = async (m: EmailMessage) => { sent.push(m); return { ok: true }; };
  await emailEmployer(send, config, employer);
  await emailEmployer(send, config, employer);
  assert.deepEqual(sent[0], sent[1]);
});

test("a refused send is reported as a failure", async () => {
  assert.equal(await emailEmployer(async () => ({ ok: false }), config, employer), false);
});

test("the idempotency key is stable for the same person and message, and differs otherwise", () => {
  assert.equal(idempotencyKey(employer), idempotencyKey({ ...employer, email: "sam@co.com", phone: "555 123 4567" }));
  assert.notEqual(idempotencyKey(employer), idempotencyKey({ ...employer, message: "Different" }));
  assert.ok(idempotencyKey(employer).length <= 256);
});

test("the subject can't carry extra header lines and has a fallback for no company", () => {
  assert.equal(employerSubject({ ...employer, company: "", first: "Sam\r\nBcc: x@y.z" }), "Website enquiry — no company given — Sam Bcc: x@y.z Lee");
});

test("email config needs both addresses", () => {
  assert.deepEqual(emailConfig({ CONTACT_TO_EMAIL: " a@b.co ", CONTACT_FROM_EMAIL: "w@b.co" }), { to: "a@b.co", from: "w@b.co" });
  assert.equal(emailConfig({ CONTACT_TO_EMAIL: "a@b.co" }), null);
  assert.equal(emailConfig({ CONTACT_FROM_EMAIL: "w@b.co", CONTACT_TO_EMAIL: "  " }), null);
});
