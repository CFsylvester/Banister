#!/usr/bin/env node
// cms:export-model --env <id> — write the environment's real content types to contentful/content-model.json
// (stable order, internal log type excluded). Replaces the migration-replayed model after a live bring-up so
// cf-content-types-generator runs from exactly what Contentful holds. Read-only against Contentful.
import { writeFileSync } from "node:fs";
import { arg, die, environment } from "./lib.mjs";

const envId = arg("env") ?? die("pass --env <environment-id>");
const { env } = await environment(envId);
const res = await env.getContentTypes({ limit: 1000 });
const contentTypes = res.items.map((ct) => ct.toPlainObject())
  .filter((ct) => ct.sys.id !== "cmsMigrationLog")
  .map(({ sys, name, displayField, description, fields }) => ({ sys: { id: sys.id, type: "ContentType" }, name, displayField, description, fields }))
  .sort((a, b) => a.sys.id.localeCompare(b.sys.id));
writeFileSync("contentful/content-model.json", JSON.stringify({ contentTypes }, null, 2) + "\n");
console.log(`cms: exported ${contentTypes.length} content types from "${envId}" → contentful/content-model.json`);
