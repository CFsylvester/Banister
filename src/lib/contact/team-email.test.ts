import { test } from "node:test";
import assert from "node:assert/strict";
import type { EmailMessage } from "../email/types.ts";
import { emailConfig, emailTeam, idempotencyKey, teamSubject } from "./team-email.ts";
import type { ContactFields } from "./fields.ts";

const employer: ContactFields = { audience: "employer", first: "Sam", last: "Lee", email: "Sam@Co.com", phone: "", method: "Email", message: "Hiring a CFO.\nUrgent.", company: "Acme" };
const candidate: ContactFields = { audience: "candidate", first: "Jane", last: "Doe", email: "jane@firm.com", phone: "555-123-4567", method: "Phone", message: "Open to CFO roles.", company: "" };
const config = { to: "team@banisterintus.com", from: "Banister website <website@banisterintus.com>" };

test("the enquiry goes to the configured inbox, replies go to the employer, and every field is in the text", async () => {
  const sent: EmailMessage[] = [];
  assert.equal(await emailTeam(async (m) => { sent.push(m); return { ok: true }; }, config, employer), true);
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
  await emailTeam(send, config, employer);
  await emailTeam(send, config, employer);
  assert.deepEqual(sent[0], sent[1]);
});

test("a candidate goes to the same inbox, says whether a résumé came, and has no company line", async () => {
  const sent: EmailMessage[] = [];
  const send = async (m: EmailMessage) => { sent.push(m); return { ok: true }; };
  assert.equal(await emailTeam(send, config, candidate, true), true);
  await emailTeam(send, config, candidate, false);
  const [withCv, without] = sent;
  assert.equal(withCv.to, config.to);
  assert.equal(withCv.replyTo, "jane@firm.com");
  assert.equal(withCv.subject, "Website candidate — Jane Doe");
  for (const s of ["candidate form", "“Resumes received” list", "Name: Jane Doe", "Email: jane@firm.com", "Phone: 555-123-4567", "Preferred contact: Phone", "Résumé: attached to their Ezekia record", "Message:\nOpen to CFO roles."]) {
    assert.ok(withCv.text.includes(s), s);
  }
  assert.ok(!withCv.text.includes("Company:"));
  assert.ok(without.text.includes("Résumé: none"));
  // Different text, different key: Resend may refuse a reused key with a different payload.
  assert.notEqual(withCv.idempotencyKey, without.idempotencyKey);
});

test("an employer email never mentions a résumé, even if one is claimed", async () => {
  const sent: EmailMessage[] = [];
  await emailTeam(async (m) => { sent.push(m); return { ok: true }; }, config, employer, true);
  const without: EmailMessage[] = [];
  await emailTeam(async (m) => { without.push(m); return { ok: true }; }, config, employer, false);
  assert.ok(!sent[0].text.includes("Résumé"));
  assert.deepEqual(sent[0], without[0]);
});

test("a refused send is reported as a failure", async () => {
  assert.equal(await emailTeam(async () => ({ ok: false }), config, employer), false);
});

test("the idempotency key is the same for the same payload and changes with any field, so an edited retry isn't refused", async () => {
  const keyFor = async (f: ContactFields) => {
    let key = "";
    await emailTeam(async (m) => { key = m.idempotencyKey; return { ok: true }; }, config, f);
    return key;
  };
  const base = await keyFor(employer);
  assert.equal(base, await keyFor({ ...employer }));
  for (const change of [{ email: "sam@co.com" }, { phone: "555 123 4567" }, { first: "Samuel" }, { method: "Phone" as const }, { company: "Acme Inc" }, { message: "Different" }, { audience: "candidate" as const }]) {
    assert.notEqual(base, await keyFor({ ...employer, ...change }), JSON.stringify(change));
  }
  assert.ok(base.length <= 256);
  const message = { from: config.from, to: config.to, replyTo: "a@b.co", subject: "s", text: "t" };
  assert.notEqual(idempotencyKey(message), idempotencyKey({ ...message, to: "other@banisterintus.com" }));
});

test("the subject can't carry extra header lines and has a fallback for no company", () => {
  assert.equal(teamSubject({ ...employer, company: "", first: "Sam\r\nBcc: x@y.z" }), "Website enquiry — no company given — Sam Bcc: x@y.z Lee");
});

test("email config needs both addresses and the Resend key", () => {
  const key = { RESEND_API_KEY: "re_test" };
  assert.deepEqual(emailConfig({ ...key, CONTACT_TO_EMAIL: " a@b.co ", CONTACT_FROM_EMAIL: "w@b.co" }), { to: "a@b.co", from: "w@b.co" });
  assert.equal(emailConfig({ ...key, CONTACT_TO_EMAIL: "a@b.co" }), null);
  assert.equal(emailConfig({ ...key, CONTACT_FROM_EMAIL: "w@b.co", CONTACT_TO_EMAIL: "  " }), null);
  assert.equal(emailConfig({ CONTACT_TO_EMAIL: "a@b.co", CONTACT_FROM_EMAIL: "w@b.co" }), null);
  assert.equal(emailConfig({ CONTACT_TO_EMAIL: "a@b.co", CONTACT_FROM_EMAIL: "w@b.co", RESEND_API_KEY: " " }), null);
});
