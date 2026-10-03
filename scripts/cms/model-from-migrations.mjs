#!/usr/bin/env node
// model-from-migrations.mjs — replay contentful/migrations/NNNN-*.ts against a recording stub of the migration DSL
// and write contentful/content-model.json in contentful-export shape ({ contentTypes: [...] }), the input
// cf-content-types-generator accepts (node_modules/cf-content-types-generator/README.md, "Generate From A Local Export").
// The migrations are the single source of truth: this file is always derived from them (cms:prepare regenerates it
// every build; never hand-edit it or replace it with a live export). `--out <path>` writes elsewhere (used by the test). Supports only the DSL calls our migrations use — anything else throws.
import { readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dir = resolve("contentful/migrations");
const types = new Map();

const fieldApi = (field) => {
  const api = {};
  for (const k of ["name", "type", "required", "validations", "items", "linkType", "localized", "disabled", "omitted"])
    api[k] = (v) => { field[k] = v; return api; };
  return api;
};
const ctApi = (ct) => {
    const api = {
      name: (v) => { ct.name = v; return api; },
      displayField: (v) => { ct.displayField = v; return api; },
      description: (v) => { ct.description = v; return api; },
      changeFieldControl: () => api, // editor-interface settings are not part of the content-type export
      createField: (fid) => {
        const f = { id: fid, name: fid, type: null, localized: false, required: false, validations: [], disabled: false, omitted: false };
        ct.fields.push(f); return fieldApi(f);
      },
      moveField: (fid) => ({
        afterField: (other) => {
          const i = ct.fields.findIndex((f) => f.id === fid), [f] = ct.fields.splice(i, 1);
          ct.fields.splice(ct.fields.findIndex((x) => x.id === other) + 1, 0, f);
        },
      }),
    };
    return api;
};
const migration = {
  createContentType(id) {
    if (types.has(id)) throw new Error(`content type ${id} created twice`);
    const ct = { sys: { id, type: "ContentType" }, name: id, displayField: null, description: "", fields: [] };
    types.set(id, ct);
    return ctApi(ct);
  },
  editContentType(id) {
    const ct = types.get(id);
    if (!ct) throw new Error(`editContentType: ${id} does not exist yet`);
    return ctApi(ct);
  },
};
for (const k of ["deleteContentType", "transformEntries", "deriveLinkedEntries"])
  migration[k] = () => { throw new Error(`model-from-migrations: ${k} not supported by the stub — use a live export`); };

const files = readdirSync(dir).filter((f) => /^\d{4}-.*\.ts$/.test(f)).sort();
for (const f of files) (await import(pathToFileURL(resolve(dir, f)).href)).default(migration, {});
const contentTypes = [...types.values()].sort((a, b) => a.sys.id.localeCompare(b.sys.id));
for (const ct of contentTypes) if (ct.displayField && !ct.fields.some((f) => f.id === ct.displayField)) throw new Error(`${ct.sys.id}: displayField ${ct.displayField} is not a field`);
const outIdx = process.argv.indexOf("--out");
const outPath = outIdx !== -1 ? process.argv[outIdx + 1] : "contentful/content-model.json";
writeFileSync(outPath, JSON.stringify({ contentTypes }, null, 2) + "\n");
console.log(`content-model.json: ${contentTypes.length} types from ${files.length} migration(s): ${contentTypes.map((c) => c.sys.id).join(", ")}`);
