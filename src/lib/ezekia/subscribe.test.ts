import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createEzekiaClient, EZEKIA_BASE_URL } from "./client.ts";
import { subscribeToList, SIGNUP_PLACEHOLDER } from "./subscribe.ts";

const token = randomBytes(16).toString("hex");
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
type Seen = { method: string; url: string; body: unknown };

function harness(responses: Response[]) {
  const seen: Seen[] = [];
  const client = createEzekiaClient({
    token,
    fetch: async (url, init) => {
      seen.push({ method: init?.method ?? "GET", url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const next = responses.shift();
      if (!next) throw new Error("test: unexpected extra request");
      return next;
    },
    sleep: async () => {},
  });
  return { client, seen };
}

test("an existing person is added to the list as-is, never re-created or edited", async () => {
  const h = harness([
    json(200, { data: [{ id: 41, emails: [{ id: 1, address: "Jane@Firm.com" }], updatedAt: "2026-01-01" }] }),
    json(200, { data: { id: 1003445 } }),
  ]);
  assert.deepEqual(await subscribeToList(h.client, 1003445, "jane@firm.com"), { personId: 41, created: false });
  assert.deepEqual(h.seen.map((s) => s.method), ["GET", "PUT"]);
  assert.equal(h.seen[1].url, `${EZEKIA_BASE_URL}/lists/1003445/people/41`);
});

test("a new email creates a person with the placeholders Ezekia requires, then adds them to the list", async () => {
  const h = harness([json(200, { data: [] }), json(201, { data: { id: 77 } }), json(200, { data: { id: 1003445 } })]);
  assert.deepEqual(await subscribeToList(h.client, 1003445, "new.person@firm.com"), { personId: 77, created: true });
  const [, create, add] = h.seen;
  assert.equal(create.method, "POST");
  assert.deepEqual(create.body, {
    firstName: "new.person", lastName: SIGNUP_PLACEHOLDER.lastName, companyName: SIGNUP_PLACEHOLDER.companyName,
    emails: [{ address: "new.person@firm.com", isDefault: true }],
  });
  assert.equal(add.method, "PUT");
  assert.equal(add.url, `${EZEKIA_BASE_URL}/lists/1003445/people/77`);
});

test("a search hit on a different email (looser server match) is ignored, so a new person is created", async () => {
  const h = harness([
    json(200, { data: [{ id: 5, emails: [{ id: 1, address: "jane@firm.co" }] }] }),
    json(201, { data: { id: 6 } }), json(200, { data: { id: 1 } }),
  ]);
  assert.equal((await subscribeToList(h.client, 1, "jane@firm.com")).personId, 6);
});
