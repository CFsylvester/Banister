import { test } from "node:test";
import assert from "node:assert/strict";
import type { EzekiaClient, EzekiaPerson } from "../ezekia/client.ts";
import { EzekiaUpstreamError } from "../ezekia/errors.ts";
import type { ContactFields } from "./fields.ts";
import { CANDIDATE_LIST_ID, PLACEHOLDER_COMPANY, recordSubmission } from "./record.ts";
import type { Resume } from "./resume.ts";

const AT = new Date("2026-11-13T18:00:00Z");
const candidate: ContactFields = { audience: "candidate", first: "Jane", last: "Doe", email: "jane@firm.com", phone: "555-123-4567", method: "Email", message: "Hello", company: "" };
const employer: ContactFields = { ...candidate, audience: "employer", company: "Acme", phone: "" };
const cv: Resume = { file: new Blob(["%PDF-"]), filename: "cv.pdf", kind: "pdf" };

/** A fake client that records every call by name, with canned answers. */
function fake(o: { matches?: EzekiaPerson[]; created?: EzekiaPerson; failOn?: string; noteNotUpdated?: boolean } = {}) {
  const calls: [string, ...unknown[]][] = [];
  const step = (name: string, result: unknown) => async (...args: unknown[]) => {
    calls.push([name, ...args]);
    if (o.failOn === name) throw new EzekiaUpstreamError(`POST /${name}`, 503);
    return result;
  };
  const created = o.created ?? { id: 7 };
  const noteResult = o.noteNotUpdated ? { updated: [], notUpdated: [created.id] } : { updated: [], notUpdated: [] };
  const client = {
    findPeopleByEmail: step("find", o.matches ?? []),
    createPersonFromCv: step("createFromCv", created),
    createPerson: step("create", created),
    updatePersonNames: step("names", created),
    addEmail: step("email", {}),
    addPhone: step("phone", {}),
    addDocument: step("document", {}),
    addPersonToList: step("list", { data: { id: CANDIDATE_LIST_ID } }),
    addNote: step("note", noteResult),
  } as unknown as EzekiaClient;
  return { client, calls, names: () => calls.map((c) => c[0]) };
}

test("new candidate with a résumé: created from the CV, then the form's names, email and phone, the list, then the note", async () => {
  const f = fake();
  assert.deepEqual(await recordSubmission(f.client, candidate, cv, AT), { personId: 7, created: true, multipleMatches: false });
  // The email straight after the create, so a retry after a later failure finds this person.
  assert.deepEqual(f.names(), ["find", "createFromCv", "email", "names", "phone", "list", "note"]);
  assert.deepEqual(f.calls[2], ["email", 7, "jane@firm.com", true]);
  assert.deepEqual(f.calls[3], ["names", 7, { firstName: "Jane", lastName: "Doe" }]);
  assert.deepEqual(f.calls[5], ["list", 773048, 7]);
  const note = String(f.calls[6][2]);
  assert.match(note, /^Submitted via website: candidate form, 2026-11-13T18:00:00.000Z/);
  assert.match(note, /Résumé: attached, profile built from it/);
  assert.match(note, /Message:\nHello$/);
});

test("new candidate whose parsed CV already has the email and phone: nothing is added twice", async () => {
  const f = fake({ created: { id: 7, emails: [{ id: 1, address: "JANE@firm.com" }], phones: [{ id: 2, number: "+1 (555) 123 4567" }] } });
  await recordSubmission(f.client, candidate, cv, AT);
  assert.deepEqual(f.names(), ["find", "createFromCv", "names", "list", "note"]);
});

test("new candidate without a résumé: created from the fields with the placeholder company", async () => {
  const f = fake({ created: { id: 7, emails: [{ id: 1, address: "jane@firm.com" }], phones: [{ id: 2, number: "5551234567" }] } });
  await recordSubmission(f.client, candidate, null, AT);
  assert.deepEqual(f.names(), ["find", "create", "list", "note"]);
  assert.deepEqual(f.calls[1][1], { firstName: "Jane", lastName: "Doe", email: "jane@firm.com", phone: "555-123-4567", companyName: PLACEHOLDER_COMPANY });
  assert.match(String(f.calls[3][2]), /Résumé: none/);
});

test("existing candidate: the CV becomes a document and they join the list; contact details are untouched, the phone goes in the note only", async () => {
  const f = fake({ matches: [{ id: 3, phones: [] }] });
  assert.deepEqual(await recordSubmission(f.client, candidate, cv, AT), { personId: 3, created: false, multipleMatches: false });
  // The list first: a retry after a later failure then repeats only the PUT, not a second CV upload.
  assert.deepEqual(f.names(), ["find", "list", "document", "note"]);
  assert.deepEqual(f.calls[1], ["list", 773048, 3]);
  assert.deepEqual(f.calls[2], ["document", 3, cv.file, "cv.pdf"]);
  assert.match(String(f.calls[3][2]), /phone 555-123-4567[\s\S]*attached as a document \(profile not changed\)/);
});

test("a note Ezekia reports as not saved is a failure, so the form can't show success", async () => {
  await assert.rejects(recordSubmission(fake({ noteNotUpdated: true }).client, candidate, null, AT), /note not saved/);
  await assert.rejects(recordSubmission(fake({ matches: [{ id: 7 }], noteNotUpdated: true }).client, employer, null, AT), /note not saved/);
});

test("several people share the email: the first (most recently updated) is used and the note says so", async () => {
  const f = fake({ matches: [{ id: 3, phones: [{ id: 1, number: "555 123 4567" }] }, { id: 9 }] });
  assert.deepEqual(await recordSubmission(f.client, candidate, null, AT), { personId: 3, created: false, multipleMatches: true });
  assert.deepEqual(f.names(), ["find", "list", "note"]);
  assert.deepEqual(f.calls[1], ["list", 773048, 3]);
  assert.match(String(f.calls[2][2]), /more than one person in Ezekia has this email/);
});

test("employer: created with their company, never with a résumé or the candidate list, and the note names the company", async () => {
  const f = fake({ created: { id: 7, emails: [{ id: 1, address: "jane@firm.com" }] } });
  await recordSubmission(f.client, employer, cv, AT);
  assert.deepEqual(f.names(), ["find", "create", "note"]);
  assert.equal((f.calls[1][1] as { companyName: string }).companyName, "Acme");
  assert.match(String(f.calls[2][2]), /employer enquiry[\s\S]*Company: Acme/);
  const noCompany = fake({ created: { id: 7, emails: [{ id: 1, address: "jane@firm.com" }] } });
  await recordSubmission(noCompany.client, { ...employer, company: "" }, null, AT);
  assert.equal((noCompany.calls[1][1] as { companyName: string }).companyName, PLACEHOLDER_COMPANY);
});

test("an Ezekia failure at any step reaches the caller, so the form can't show success", async () => {
  for (const step of ["find", "createFromCv", "email", "names", "list", "note"]) {
    await assert.rejects(recordSubmission(fake({ failOn: step }).client, candidate, cv, AT), EzekiaUpstreamError);
  }
  // A failed list add stops before anything a retry would duplicate.
  const existing = fake({ matches: [{ id: 3 }], failOn: "list" });
  await assert.rejects(recordSubmission(existing.client, candidate, cv, AT), EzekiaUpstreamError);
  assert.deepEqual(existing.names(), ["find", "list"]);
});
