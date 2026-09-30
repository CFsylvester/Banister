#!/usr/bin/env node
// model-from-migrations.mjs — replay contentful/migrations/*.cjs against a recording stub of the migration DSL
// and write contentful/content-model.json in contentful-export shape ({ contentTypes: [...] }), the input
// cf-content-types-generator accepts (node_modules/cf-content-types-generator/README.md, "Generate From A Local Export").
// The migrations stay the single source of truth; after a live bring-up, `pnpm cms:export-model` overwrites
// this file with the real export. Supports only the DSL calls our migrations use — anything else throws.
import { readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const dir = resolve("contentful/migrations");
const types = new Map();

const fieldApi = (field) => {
  const api = {};
  for (const k of ["name", "type", "required", "validations", "items", "linkType", "localized", "disabled", "omitted"])
    api[k] = (v) => { field[k] = v; return api; };
  return api;
};
const migration = {
  createContentType(id) {
    if (types.has(id)) throw new Error(`content type ${id} created twice`);
    const ct = { sys: { id, type: "ContentType" }, name: id, displayField: null, description: "", fields: [] };
    types.set(id, ct);
    const api = {
      name: (v) => { ct.name = v; return api; },
      displayField: (v) => { ct.displayField = v; return api; },
      description: (v) => { ct.description = v; return api; },
      createField: (fid) => {
        const f = { id: fid, name: fid, type: null, localized: false, required: false, validations: [], disabled: false, omitted: false };
        ct.fields.push(f); return fieldApi(f);
      },
    };
    return api;
  },
};
for (const k of ["editContentType", "deleteContentType", "transformEntries", "deriveLinkedEntries"])
  migration[k] = () => { throw new Error(`model-from-migrations: ${k} not supported by the stub — use a live export`); };

const files = readdirSync(dir).filter((f) => /^\d{4}-.*\.cjs$/.test(f)).sort();
for (const f of files) require(resolve(dir, f))(migration, {});
const contentTypes = [...types.values()].sort((a, b) => a.sys.id.localeCompare(b.sys.id));
for (const ct of contentTypes) if (ct.displayField && !ct.fields.some((f) => f.id === ct.displayField)) throw new Error(`${ct.sys.id}: displayField ${ct.displayField} is not a field`);
writeFileSync("contentful/content-model.json", JSON.stringify({ contentTypes }, null, 2) + "\n");
console.log(`content-model.json: ${contentTypes.length} types from ${files.length} migration(s): ${contentTypes.map((c) => c.sys.id).join(", ")}`);
