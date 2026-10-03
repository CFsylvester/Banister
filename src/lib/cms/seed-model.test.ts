// The seed must fit the content model exactly. The offline fixture ignores unknown fields, so without this test a
// field removed from a migration can linger in the seed and only fail when `pnpm cms:seed` hits Contentful
// (review finding B1: a leftover `mediaType` on the hero). Also guards against a stale content-model.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Field = { id: string; required: boolean };
const model = JSON.parse(readFileSync("contentful/content-model.json", "utf8")) as { contentTypes: { sys: { id: string }; fields: Field[] }[] };
const seed = JSON.parse(readFileSync("contentful/seed/home.json", "utf8")) as { entries: { id: string; contentType: string; fields: Record<string, unknown> }[] };
const types = new Map(model.contentTypes.map((c) => [c.sys.id, c.fields]));

test("every seed entry uses only fields its content type defines, and fills every required field", () => {
  for (const e of seed.entries) {
    const fields = types.get(e.contentType);
    assert.ok(fields, `${e.id}: unknown content type ${e.contentType}`);
    const known = new Set(fields!.map((f) => f.id));
    assert.deepEqual(Object.keys(e.fields).filter((k) => !known.has(k)), [], `${e.id}: fields not in the ${e.contentType} model`);
    const empty = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    const missing = fields!.filter((f) => f.required && empty(e.fields[f.id])).map((f) => f.id);
    assert.deepEqual(missing, [], `${e.id}: required fields missing`);
  }
});

test("contentful/content-model.json matches the migrations (run `pnpm cms:model` after editing one)", () => {
  // Replays into a temp file — the test never rewrites the working tree.
  const tmp = join(mkdtempSync(join(tmpdir(), "cms-model-")), "content-model.json");
  execFileSync(process.execPath, ["scripts/cms/model-from-migrations.mjs", "--out", tmp], { stdio: "ignore" });
  assert.equal(readFileSync(tmp, "utf8"), readFileSync("contentful/content-model.json", "utf8"),
    "content-model.json is stale — run `pnpm cms:model` and commit it");
});
