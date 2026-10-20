#!/usr/bin/env node
// ezekia-sync.test.mjs — prove the generator projects the CURRENT surface (highest non-deprecated version wins,
// deprecated ops land only in the migration table, version-free paths survive), flags undeclared path placeholders,
// hoists shared params, is byte-deterministic, and that the CLI's --check exits 0 in sync / 1 on drift / 2 on a bad
// spec. Live CLI runs go through a temp dir whose path contains a SPACE (the entrypoint-idiom class). Pure: a local
// fixture spec, no network, no git.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalHash, collectOperations, currentSurface, localDrift, readTree as readTreeFiles, render, slug, splitVersion } from "./ezekia-sync.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "ezekia-sync.mjs");
const COMMITTED = join(HERE, "..", "references");
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_"))); // env-hygiene rule
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log(`  ✓ ${name}`); } catch (e) { fail++; console.log(`  ✗ ${name}\n      ${e.message}`); } };

const page = { name: "page", in: "query", schema: { type: "integer" }, description: "Page number." };
const fixture = () => ({
  openapi: "3.0.0",
  info: { title: "Ezekia", version: "9.9.9" },
  servers: [{ url: "https://ezekia.com/api" }],
  components: {
    securitySchemes: { "api.bearer": { type: "http", scheme: "bearer" } },
    parameters: { "api.page": page },
    schemas: {
      "api.person": { type: "object", required: ["id"], properties: { id: { type: "integer", description: "Person id" }, fullName: { type: "string" } } },
      "api.person.field": { type: "string", enum: ["owners", "aliases"] },
    },
  },
  paths: {
    "/v1/people": { get: { tags: ["People"], deprecated: true, summary: "old", description: "**Deprecated.** Removed on 1 January 2027. Use `/api/v4/people` instead." } },
    "/v3/people": { get: { tags: ["People"], summary: "v3 list", parameters: [{ $ref: "#/components/parameters/api.page" }] } },
    "/v4/people": { get: { tags: ["People"], summary: "List people", parameters: [{ $ref: "#/components/parameters/api.page" },
      { name: "fields", in: "query", schema: { type: "array", items: { $ref: "#/components/schemas/api.person.field" } } }],
      responses: { 200: { description: "ok", content: { "application/json": { schema: { properties: { data: { type: "array", items: { $ref: "#/components/schemas/api.person" } } } } } } } } } },
    "/v3/legacy-only": { get: { tags: ["Legacy"], summary: "only in v3", parameters: [{ $ref: "#/components/parameters/api.page" }] } },
    "/v4/assignments/{assignmentId}/tags/{tagId}": { post: { tags: ["Projects"], summary: "tag", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }, { $ref: "#/components/parameters/api.page" }] } },
    "/v4/briefs/{briefId}/documents": { post: { tags: ["Documents"], summary: "phantom params", parameters: [{ name: "type", in: "path", required: true }, { name: "id", in: "path", required: true }] } },
    "/v4/notes/{noteId}": { get: { tags: ["Notes"], summary: "renamed", parameters: [{ name: "id", in: "path", required: true }] } },
    "/categories": { get: { tags: ["Categories"], summary: "version-free" } },
    "/v1/categories": { get: { tags: ["Categories"], deprecated: true, summary: "old, no replacement named" } },
  },
});

t("splitVersion parses /vN prefixes and leaves version-free paths alone", () => {
  assert.deepEqual(splitVersion("/v4/people/{id}"), { version: 4, rest: "/people/{id}" });
  assert.deepEqual(splitVersion("/categories"), { version: null, rest: "/categories" });
});

t("current surface = highest NON-deprecated version per endpoint (+ v3-only + version-free)", () => {
  const cur = currentSurface(collectOperations(fixture())).map((o) => `${o.method} ${o.path}`).sort();
  assert.deepEqual(cur, ["get /categories", "get /v3/legacy-only", "get /v4/notes/{noteId}", "get /v4/people", "post /v4/assignments/{assignmentId}/tags/{tagId}", "post /v4/briefs/{briefId}/documents"]);
});

t("a deprecated v-latest does NOT win over a live older version", () => {
  const s = fixture(); s.paths["/v4/legacy-only"] = { get: { tags: ["Legacy"], deprecated: true, summary: "x" } };
  const cur = currentSurface(collectOperations(s)).map((o) => o.path);
  assert.ok(cur.includes("/v3/legacy-only") && !cur.includes("/v4/legacy-only"));
});

const { files, hash } = render(fixture(), { date: "2026-10-01" });

t("deprecated ops appear ONLY in the migration table, with removal date + replacement", () => {
  assert.match(files["deprecations.md"], /\| `GET` \| `\/api\/v1\/people` \| 1 January 2027 \| `\/api\/v4\/people` \|/);
  assert.ok(!Object.entries(files).some(([k, v]) => k.startsWith("current/") && v.includes("/api/v1/people")));
});

t("a deprecated /vN op is never 'replaced' by a version-free path", () => {
  assert.match(files["deprecations.md"], /\| `GET` \| `\/api\/v1\/categories` \|  \| — \|/);
});

t("undeclared path placeholders are FLAGGED, not silently reproduced", () => {
  assert.match(files["current/projects.md"], /Spec inconsistency: path placeholder\(s\) `\{assignmentId\}`, `\{tagId\}`/);
  assert.match(files["current/projects.md"], /Declared path params absent from the path: `id` \(may be spurious\)\. Infer the undocumented/);
  assert.ok(!files["current/people.md"].includes("Spec inconsistency"));
});

t("orphan path params: equal counts → positional mapping hint; unequal → both sets listed, never 'Only X of Y'", () => {
  assert.match(files["current/notes.md"], /Likely mapping by position: `\{noteId\}` ← `id`/);
  assert.match(files["current/documents.md"], /`\{briefId\}` not declared as path params\. Declared path params absent from the path: `type`, `id`/);
});

t("COMMITTED references: no self-contradictory placeholder warning (the 'Only 2 of 1' class)", () => {
  for (const [k, v] of Object.entries(readTreeFiles(COMMITTED))) assert.ok(!/Only \d+ of \d+ placeholders/.test(v), k);
});

t("a $ref param used by >=3 tags is hoisted to conventions.md and referenced by name", () => {
  assert.match(files["conventions.md"], /\*\*api\.page\*\* — `page` \(query, integer\)/);
  assert.match(files["current/people.md"], /\*\*Shared params\*\* \(see `conventions.md`\): `page`/);
});

t("param/response schemas (incl. enums) are rendered next to the operation", () => {
  assert.match(files["current/people.md"], /### `api\.person\.field`\n\n_string ∈ \{"owners", "aliases"\}_/);
  assert.match(files["current/people.md"], /\| `id` \| integer \| yes \| Person id \|/);
});

t("a request body with several content types renders EVERY variant (the hidden multipart `resume` class)", () => {
  const s = fixture();
  s.components.requestBodies = { "api.v4.person.storeRequest": { required: true, content: {
    "multipart/form-data": { schema: { $ref: "#/components/schemas/api.person.storeFile" } },
    "application/json": { schema: { $ref: "#/components/schemas/api.v4.person.store" } } } } };
  s.components.schemas["api.v4.person.store"] = { type: "object", required: ["fullName"], properties: { fullName: { type: "string" } } };
  s.components.schemas["api.person.storeFile"] = { title: "Person Store with Resume Body", type: "object", required: ["resume"],
    properties: { resume: { type: "string", format: "binary" }, ownerId: { type: "integer", nullable: true } } };
  s.paths["/v4/people"].post = { tags: ["People"], summary: "Create person", requestBody: { $ref: "#/components/requestBodies/api.v4.person.storeRequest" } };
  const md = render(s, { date: "2026-10-01" }).files["current/people.md"];
  const op = md.slice(md.indexOf("### `POST /api/v4/people`"));
  assert.match(op, /\*\*Body\*\* \(`application\/json`, `multipart\/form-data`, required\) — `api\.v4\.person\.storeRequest` — 2 variants, one per distinct schema/);
  const json = op.indexOf("*As `application/json`* — `api.v4.person.store`"), multi = op.indexOf("*As `multipart/form-data`* — `api.person.storeFile` (Person Store with Resume Body)");
  assert.ok(json >= 0 && multi > json, "json variant first, multipart variant after it");
  assert.match(op.slice(json, multi), /\| `fullName` \| string \| yes \|/);
  assert.match(op.slice(multi), /\| `resume` \| string\(binary\) \| yes \|/);
});

t("inline body variants: titled inline schema, a schema-less type, and key order never splits a group", () => {
  const s = fixture();
  s.paths["/v4/uploads"] = { post: { tags: ["Uploads"], summary: "upload", requestBody: { content: {
    "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } },
    "application/x-www-form-urlencoded": { schema: { properties: { name: { type: "string" } }, type: "object" } },
    "multipart/form-data": { schema: { title: "Upload Body", type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } },
    "text/plain": {} } } } };
  const md = render(s, { date: "2026-10-01" }).files["current/uploads.md"];
  const op = md.slice(md.indexOf("### `POST /api/v4/uploads`"));
  assert.match(op, /— 3 variants, one per distinct schema/);
  assert.match(op, /\*As `application\/json`, `application\/x-www-form-urlencoded`\*\n/);
  assert.match(op, /\*As `multipart\/form-data`\* \(Upload Body\)\n\n\| field \|[\s\S]*\| `file` \| string\(binary\) \| yes \|/);
  assert.match(op, /\*As `text\/plain`\*\n\n_No documented fields\._/);
});

t("a one-type body, or several types sharing ONE schema, keep the compact single-table form", () => {
  const s = fixture();
  s.components.schemas["api.note.store"] = { type: "object", properties: { text: { type: "string" } } };
  const ref = { $ref: "#/components/schemas/api.note.store" };
  s.paths["/v4/notes"] = {
    post: { tags: ["Notes"], summary: "one type", requestBody: { content: { "application/json": { schema: ref } } } },
    put: { tags: ["Notes"], summary: "same schema twice", requestBody: { content: { "application/json": { schema: ref }, "application/x-www-form-urlencoded": { schema: ref } } } },
  };
  const md = render(s, { date: "2026-10-01" }).files["current/notes.md"];
  const post = md.slice(md.indexOf("### `POST /api/v4/notes`"), md.indexOf("### `PUT /api/v4/notes`"));
  const put = md.slice(md.indexOf("### `PUT /api/v4/notes`"), md.indexOf("## Schemas referenced above"));
  assert.match(post, /\*\*Body\*\* \(`application\/json`\) — `api\.note\.store`\n\n\| field \|/);
  assert.match(put, /\*\*Body\*\* \(`application\/json`, `application\/x-www-form-urlencoded`\) — `api\.note\.store`\n\n\| field \|/);
  for (const op of [post, put]) { assert.ok(!op.includes("variants"), op); assert.equal(op.split("| field |").length - 1, 1, op); }
});

t("index.md pins the full sha256 + spec version and routes every tag file", () => {
  assert.match(files["index.md"], new RegExp(`ezekia-spec-sha256: ${hash}`));
  assert.match(files["index.md"], /ezekia-spec-version: 9\.9\.9/);
  for (const k of Object.keys(files).filter((f) => f.startsWith("current/"))) assert.ok(files["index.md"].includes("`" + k + "`"), k);
});

t("render is byte-deterministic and the hash ignores key order", () => {
  assert.deepEqual(render(fixture(), { date: "2026-10-01" }).files, files);
  const s = fixture(); const reordered = { paths: s.paths, info: s.info, ...s };
  assert.equal(canonicalHash(reordered), canonicalHash(fixture()));
});

t("index.md pins generator + tree hashes and the snapshot date", () => {
  const r = render(fixture(), { date: "2026-10-01", generatorHash: "g".repeat(64) });
  assert.match(r.files["index.md"], /ezekia-generator-sha256: g{64} -->/);
  assert.match(r.files["index.md"], /ezekia-tree-sha256: [0-9a-f]{64} -->/);
  assert.match(r.files["index.md"], /ezekia-snapshot-date: 2026-10-01 -->/);
});

t("COMMITTED references match the current generator + their pinned tree (offline; edit the script → regenerate)", () => {
  assert.deepEqual(localDrift(COMMITTED), []);
});

t("slug is filesystem-safe", () => assert.equal(slug("People (Education/Qualifications)"), "people-education-qualifications"));

// ── live CLI through a spaced path ──
const dir = mkdtempSync(join(tmpdir(), "ezekia sync "));
const specPath = join(dir, "spec.json"), out = join(dir, "refs out");
const run = (...a) => spawnSync(process.execPath, [CLI, "--spec", specPath, "--out", out, "--date", "2026-10-01", ...a], { encoding: "utf8", env: ENV });
try {
  writeFileSync(specPath, JSON.stringify(fixture()));
  t("CLI write (spaced path) → exit 0 and files on disk", () => {
    const r = run(); assert.equal(r.status, 0, r.stderr); assert.ok(existsSync(join(out, "current", "people.md")));
  });
  t("CLI --check on the same spec → exit 0 (in sync)", () => { const r = run("--check"); assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /in sync/); });
  t("CLI --check --offline on a fresh write → exit 0", () => { const r = run("--check", "--offline"); assert.equal(r.status, 0, r.stdout); });
  t("a re-run without --date keeps the pinned snapshot date (byte-identical)", () => {
    const before = readFileSync(join(out, "index.md"), "utf8");
    const r = spawnSync(process.execPath, [CLI, "--spec", specPath, "--out", out], { encoding: "utf8", env: ENV });
    assert.equal(r.status, 0, r.stderr); assert.equal(readFileSync(join(out, "index.md"), "utf8"), before);
  });
  t("output is locale-independent (et_EE collates 'z' before 't')", () => {
    const s = fixture(); for (const p of ["/v4/za", "/v4/sz", "/v4/ta"]) s.paths[p] = { get: { tags: ["People"], summary: p } };
    const sp = join(dir, "loc.json"); writeFileSync(sp, JSON.stringify(s));
    const gen = (lc, o) => spawnSync(process.execPath, [CLI, "--spec", sp, "--out", join(dir, o), "--date", "2026-10-01"], { encoding: "utf8", env: { ...ENV, LC_ALL: lc, LANG: lc } });
    assert.equal(gen("en_US.UTF-8", "en").status, 0); assert.equal(gen("et_EE.UTF-8", "et").status, 0);
    assert.equal(readFileSync(join(dir, "et", "current", "people.md"), "utf8"), readFileSync(join(dir, "en", "current", "people.md"), "utf8"));
  });
  t("a HAND-EDITED reference fails --check --offline (exit 1)", () => {
    const f = join(out, "current", "people.md"); const orig = readFileSync(f, "utf8");
    writeFileSync(f, orig + "\nhand edit\n");
    const r = run("--check", "--offline"); writeFileSync(f, orig);
    assert.equal(r.status, 1); assert.match(r.stdout, /references\/ differ from the pinned render/);
  });
  t("a HAND-EDITED index.md body (router) fails --check --offline", () => {
    const f = join(out, "index.md"); const orig = readFileSync(f, "utf8");
    writeFileSync(f, orig.replace("`current/people.md`", "`current/NOPE.md`"));
    const r = run("--check", "--offline"); writeFileSync(f, orig);
    assert.equal(r.status, 1, r.stdout);
  });
  t("a stray extra .md fails --check --offline; a .DS_Store does not", () => {
    writeFileSync(join(out, "current", ".DS_Store"), "x");
    assert.equal(run("--check", "--offline").status, 0);
    writeFileSync(join(out, "extra.md"), "x");
    const r = run("--check", "--offline"); rmSync(join(out, "extra.md")); rmSync(join(out, "current", ".DS_Store"));
    assert.equal(r.status, 1);
  });
  t("--offline without --check → exit 2 and writes nothing", () => {
    const before = readFileSync(join(out, "index.md"), "utf8");
    const r = spawnSync(process.execPath, [CLI, "--offline", "--out", out], { encoding: "utf8", env: ENV });
    assert.equal(r.status, 2); assert.equal(readFileSync(join(out, "index.md"), "utf8"), before);
  });
  t("a generator change without a regenerate is detected", () => {
    const p = localDrift(out, "0".repeat(64)); assert.equal(p.length, 1); assert.match(p[0], /generator changed since the snapshot/);
  });
  t("CLI --check after Ezekia adds an endpoint → exit 1 and names it", () => {
    const s = fixture(); s.paths["/v4/people/{id}"] = { get: { tags: ["People"], summary: "one", parameters: [{ name: "id", in: "path", required: true }] } };
    writeFileSync(specPath, JSON.stringify(s));
    const r = run("--check"); assert.equal(r.status, 1, r.stdout); assert.match(r.stdout, /\+ GET \/api\/v4\/people\/\{id\}/);
  });
  t("CLI --check after Ezekia deprecates an endpoint → exit 1 and says so", () => {
    const s = fixture(); s.paths["/v3/legacy-only"].get.deprecated = true;
    writeFileSync(specPath, JSON.stringify(s));
    const r = run("--check"); assert.equal(r.status, 1); assert.match(r.stdout, /- GET \/api\/v3\/legacy-only {2}\(now deprecated\)/);
  });
  t("regenerating removes a tag file Ezekia dropped", () => {
    const s = fixture(); delete s.paths["/v3/legacy-only"];
    writeFileSync(specPath, JSON.stringify(s)); assert.equal(run().status, 0);
    assert.ok(!existsSync(join(out, "current", "legacy.md")));
  });
  t("CLI on a non-OpenAPI document → exit 2 (never 'in sync')", () => {
    writeFileSync(specPath, JSON.stringify({ hello: "world" }));
    const r = run("--check"); assert.equal(r.status, 2); assert.match(r.stderr, /could not load spec/);
  });
} finally { rmSync(dir, { recursive: true, force: true }); }

console.log(`\nezekia-sync: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
