#!/usr/bin/env node
// cms:sandbox <id> — create a sandbox environment cloned from master (contentful-management
// createEnvironmentWithId(id, { name }, 'master')). Idempotent: an existing environment is reported, not recreated.
import { die, environment, getOrNull } from "./lib.mjs";

const id = process.argv[2];
if (!id || id.startsWith("--") || id === "master") die("usage: pnpm cms:sandbox <sandbox-id>   (not master)");
const { space } = await environment(null);
const existing = await getOrNull(() => space.getEnvironment(id));
if (existing) { console.log(`cms: environment "${id}" already exists (status: ${existing.sys.status?.sys?.id ?? "unknown"})`); process.exit(0); }
const env = await space.createEnvironmentWithId(id, { name: id }, "master");
console.log(`cms: created sandbox "${env.sys.id}" from master — it may take a minute to become ready`);
