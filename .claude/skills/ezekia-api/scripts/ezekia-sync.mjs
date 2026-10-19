#!/usr/bin/env node
// ezekia-sync.mjs — regenerate the ezekia-api skill's references/ from Ezekia's LIVE OpenAPI spec, or detect drift.
//
// WHY GENERATED. Ezekia publishes its API as one OpenAPI 3 document (~3 MB, 800+ operations) behind a Swagger UI
// shell at https://ezekia.com/api/documentation — the UI loads https://ezekia.com/docs?api-docs.json (read from the
// page source 2026-10-01). Hand-copying that would rot silently as Ezekia ships changes, so the references are a
// deterministic PROJECTION of the spec. index.md pins THREE hashes: the spec (canonical JSON), this generator script,
// and the rendered tree. Re-running with an unchanged spec + generator reuses the pinned snapshot date, so the output
// is byte-identical. `--check` fails on ANY of: live spec ≠ pinned spec, script ≠ pinned generator (an edit without a
// regenerate), on-disk tree ≠ pinned tree (a hand edit). `--check --offline` skips the spec fetch (the CI step).
//
// WHAT IS PROJECTED. The CURRENT surface only: for every (method, path-without-version) the highest-numbered
// NON-deprecated version (v4 where it exists, else v3 …) plus the version-free paths. Deprecated operations collapse
// into one migration table (references/deprecations.md). Parameters/schemas shared by >= SHARED_MIN tags are hoisted
// into references/conventions.md so each tag file stays small enough to load on demand.
//
//   node ezekia-sync.mjs                    fetch the live spec → rewrite ../references/   (exit 0)
//   node ezekia-sync.mjs --check            fetch the live spec → exit 0 in sync / 1 drift (prints the op diff)
//   node ezekia-sync.mjs --check --offline  no network: generator + tree pins only (exit 0 / 1)
//   node ezekia-sync.mjs --spec <file>      use a local spec instead of the network (tests, offline)
//   node ezekia-sync.mjs --out <dir>        write somewhere other than ../references/
//   node ezekia-sync.mjs --date YYYY-MM-DD  stamp a fixed snapshot date; default = the pinned date if spec+generator
//                                           are unchanged, else today (UTC)
// Exit 2 = could not fetch/parse the spec (never treated as "in sync").
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SPEC_URL = "https://ezekia.com/docs?api-docs.json";
export const DOCS_URL = "https://ezekia.com/api/documentation";
const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(HERE, "..", "references");
const SHARED_MIN = 3; // a $ref'd parameter/schema used by >= this many tags is documented once, in conventions.md
const DESC_MAX = 500; // characters of an operation description kept inline (full text stays in the live spec)
const FIELD_DESC_MAX = 160;
const METHODS = ["get", "post", "put", "patch", "delete"];
const FETCH_TIMEOUT_MS = 60_000;
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // locale-independent (localeCompare follows the ICU default locale)

// ── spec helpers ────────────────────────────────────────────────────────────────────────────────────────────────
export function canonicalHash(spec) {
  const sort = (v) => Array.isArray(v) ? v.map(sort)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
  return createHash("sha256").update(JSON.stringify(sort(spec))).digest("hex");
}
const refName = (ref) => ref.split("/").pop();
const deref = (spec, obj) => {
  let o = obj, guard = 0;
  while (o && o.$ref && guard++ < 10) {
    const parts = o.$ref.replace(/^#\//, "").split("/");
    o = parts.reduce((acc, k) => acc?.[k], spec);
  }
  return o || {};
};
const oneLine = (s, max) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
};
const cell = (s) => String(s).replace(/\|/g, "\\|");
export const slug = (tag) => tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untagged";
export function splitVersion(path) {
  const m = path.match(/^\/v(\d+)(\/.*)$/);
  return m ? { version: Number(m[1]), rest: m[2] } : { version: null, rest: path };
}

export function typeOf(spec, schema, depth = 0) {
  if (!schema || typeof schema !== "object") return "any";
  if (schema.$ref) return "`" + refName(schema.$ref) + "`";
  if (depth > 3) return "object";
  for (const k of ["oneOf", "anyOf", "allOf"]) if (schema[k]) return schema[k].map((s) => typeOf(spec, s, depth + 1)).join(k === "allOf" ? " & " : " \\| ");
  if (schema.type === "array") return typeOf(spec, schema.items, depth + 1) + "[]";
  let t = schema.type || (schema.properties ? "object" : "any");
  if (schema.format) t += `(${schema.format})`;
  if (schema.enum) t += " ∈ {" + schema.enum.slice(0, 12).map((e) => JSON.stringify(e)).join(", ") + (schema.enum.length > 12 ? ", …" : "") + "}";
  if (schema.nullable) t += "?";
  return t;
}

function propsTable(spec, schema) {
  const s = deref(spec, schema);
  const merged = { properties: {}, required: [] };
  for (const part of [s, ...(s.allOf || []).map((p) => deref(spec, p))]) {
    Object.assign(merged.properties, part.properties || {});
    merged.required.push(...(part.required || []));
  }
  const names = Object.keys(merged.properties).sort();
  if (!names.length) return "";
  const rows = names.map((n) => {
    const p = merged.properties[n];
    return `| \`${n}\` | ${cell(typeOf(spec, p))} | ${merged.required.includes(n) ? "yes" : ""} | ${cell(oneLine(p.description, FIELD_DESC_MAX))} |`;
  });
  return ["| field | type | req | description |", "|---|---|---|---|", ...rows].join("\n");
}

// ── projection ──────────────────────────────────────────────────────────────────────────────────────────────────
export function collectOperations(spec) {
  const ops = [];
  for (const path of Object.keys(spec.paths || {}).sort()) {
    const item = spec.paths[path];
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const { version, rest } = splitVersion(path);
      ops.push({ method, path, version, rest, op, params: [...(item.parameters || []), ...(op.parameters || [])],
        tags: op.tags?.length ? op.tags : ["Untagged"], deprecated: !!op.deprecated });
    }
  }
  return ops;
}

// current = highest non-deprecated version per (method, rest); version-free paths are always current.
export function currentSurface(ops) {
  const best = new Map();
  for (const o of ops) {
    if (o.deprecated) continue;
    const key = `${o.method} ${o.version === null ? "~" : ""}${o.rest}`;
    const prev = best.get(key);
    if (!prev || (o.version ?? -1) > (prev.version ?? -1)) best.set(key, o);
  }
  return [...best.values()].sort((a, b) => byCodeUnit(a.rest, b.rest) || METHODS.indexOf(a.method) - METHODS.indexOf(b.method));
}

function sharedRefs(spec, current) {
  const paramTags = new Map(), schemaTags = new Map();
  const note = (map, name, tag) => { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(tag); };
  for (const o of current) for (const tag of o.tags) {
    for (const p of o.params) if (p.$ref) note(paramTags, p.$ref, tag);
    for (const r of operationRefs(spec, o)) note(schemaTags, r, tag);
  }
  const pick = (m) => new Set([...m].filter(([, t]) => t.size >= SHARED_MIN).map(([k]) => k));
  return { params: pick(paramTags), schemas: pick(schemaTags) };
}

// component-schema $refs reachable from an operation — params, request body, responses (a few levels deep), so the
// enums/shapes an agent needs to fill a param or read a response are rendered next to the operation.
function operationRefs(spec, o) {
  const out = new Set();
  const visit = (s, d) => {
    if (!s || typeof s !== "object" || d > 3) return;
    if (s.$ref) {
      if (s.$ref.includes("/schemas/") && !out.has(s.$ref)) { out.add(s.$ref); visit(deref(spec, s), d + 1); }
      return;
    }
    if (s.items) visit(s.items, d + 1);
    for (const k of ["oneOf", "anyOf", "allOf"]) (s[k] || []).forEach((x) => visit(x, d + 1));
    for (const p of Object.values(s.properties || {})) visit(p, d + 1);
  };
  for (const p of o.params) visit(deref(spec, p).schema, 0);
  if (o.op.requestBody) for (const c of Object.values(deref(spec, o.op.requestBody).content || {})) visit(c.schema, 0);
  for (const r of Object.values(o.op.responses || {})) for (const c of Object.values(deref(spec, r).content || {})) visit(c.schema, 0);
  return [...out].sort();
}

// path placeholders the spec never declares as path params (e.g. `{assignmentId}` documented as `id`) — surfaced, not hidden
export function placeholderMismatch(spec, o) {
  const declared = new Set(o.params.map((p) => deref(spec, p)).filter((p) => p.in === "path").map((p) => p.name));
  return [...o.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).filter((n) => !declared.has(n));
}

function renderParam(spec, p) {
  const d = deref(spec, p);
  const bits = [d.in, d.required ? "required" : null, d.schema ? typeOf(spec, d.schema) : null].filter(Boolean).join(", ");
  return `\`${d.name}\` (${bits})${d.description ? " — " + oneLine(d.description, FIELD_DESC_MAX) : ""}`;
}

function renderBody(spec, op) {
  if (!op.requestBody) return "";
  const rb = deref(spec, op.requestBody);
  const types = Object.keys(rb.content || {}).sort();
  if (!types.length) return "";
  const head = `**Body** (\`${types.join("`, `")}\`${rb.required ? ", required" : ""})`;
  // group content types by schema: several types can carry DIFFERENT schemas (e.g. POST /v4/people: JSON fields vs
  // a multipart `resume` upload that Ezekia parses into the profile) — render each distinct one, application/json
  // first, so no variant is hidden; types sharing one schema render it once
  const order = [...types.filter((t) => t === "application/json"), ...types.filter((t) => t !== "application/json")];
  const groups = new Map();
  for (const ct of order) {
    const key = canonicalHash(rb.content[ct].schema ?? null); // key-order independent: equal schemas group together
    if (!groups.has(key)) groups.set(key, { schema: rb.content[ct].schema, types: [] });
    groups.get(key).types.push(ct);
  }
  if (groups.size === 1) {
    const schema = rb.content[types[0]].schema;
    const label = op.requestBody.$ref ? ` — \`${refName(op.requestBody.$ref)}\`` : schema?.$ref ? ` — \`${refName(schema.$ref)}\`` : "";
    return `${head}${label}\n\n${propsTable(spec, schema) || "_No documented fields._"}`;
  }
  const label = op.requestBody.$ref ? ` — \`${refName(op.requestBody.$ref)}\`` : "";
  const variants = [...groups.values()].map(({ schema, types: cts }) => {
    const name = schema?.$ref ? ` — \`${refName(schema.$ref)}\`` : "";
    const title = schema?.$ref ? deref(spec, schema).title : schema?.title;
    return `*As \`${cts.join("`, `")}\`*${name}${title ? ` (${cell(oneLine(title, 120))})` : ""}\n\n${propsTable(spec, schema) || "_No documented fields._"}`;
  });
  return `${head}${label} — ${groups.size} variants, one per distinct schema\n\n${variants.join("\n\n")}`;
}

function renderResponses(spec, op) {
  const parts = Object.keys(op.responses || {}).sort().map((code) => {
    const r = deref(spec, op.responses[code]);
    const types = Object.keys(r.content || {}).sort();
    const c = r.content?.["application/json"] || (types.length ? r.content[types[0]] : undefined);
    let shape = "";
    if (c?.schema) {
      const s = c.schema;
      shape = s.$ref ? typeOf(spec, s) : s.properties
        ? "{ " + Object.keys(s.properties).sort().map((k) => `${k}: ${typeOf(spec, s.properties[k])}`).join(", ") + " }"
        : typeOf(spec, s);
    }
    return `\`${code}\`${shape ? " → " + shape : r.description ? " — " + oneLine(r.description, 80) : ""}`;
  });
  return parts.length ? "**Responses:** " + parts.join(" · ") : "";
}

function renderOperation(spec, o, shared) {
  const { op } = o;
  const lines = [`### \`${o.method.toUpperCase()} /api${o.path}\`${op.summary ? " — " + oneLine(op.summary, 120) : ""}`];
  if (op.operationId) lines.push(`operationId: \`${op.operationId}\``);
  const undeclared = placeholderMismatch(spec, o);
  if (undeclared.length) {
    const inTemplate = new Set([...o.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]));
    const orphans = o.params.map((p) => deref(spec, p)).filter((p) => p.in === "path" && !inTemplate.has(p.name)).map((p) => p.name);
    const tick = (n) => "`" + n + "`";
    const hint = orphans.length === undeclared.length
      ? "Likely mapping by position: " + undeclared.map((n, i) => `${tick("{" + n + "}")} ← ${tick(orphans[i])}`).join(", ") + " — verify with a GET."
      : `${orphans.length ? "Declared path params absent from the path: " + orphans.map(tick).join(", ") + " (may be spurious). " : ""}` +
        "Infer the undocumented placeholder(s) from the path segment name and verify with a GET.";
    lines.push("", `> ⚠️ Spec inconsistency: path placeholder(s) ${undeclared.map((n) => tick("{" + n + "}")).join(", ")} not declared as path params. ${hint}`);
  }
  if (op.description && oneLine(op.description, DESC_MAX) !== oneLine(op.summary, DESC_MAX)) lines.push("", oneLine(op.description, DESC_MAX));
  const local = o.params.filter((p) => !(p.$ref && shared.params.has(p.$ref)));
  const common = o.params.filter((p) => p.$ref && shared.params.has(p.$ref)).map((p) => "`" + (deref(spec, p).name || refName(p.$ref)) + "`");
  if (local.length) lines.push("", "**Params:**", ...local.map((p) => "- " + renderParam(spec, p)));
  if (common.length) lines.push("", `**Shared params** (see \`conventions.md\`): ${common.join(", ")}`);
  const body = renderBody(spec, op);
  if (body) lines.push("", body);
  const resp = renderResponses(spec, op);
  if (resp) lines.push("", resp);
  return lines.join("\n");
}

function renderSchemaSection(spec, refs) {
  return refs.map((ref) => {
    const s = deref(spec, { $ref: ref });
    const head = `### \`${refName(ref)}\``;
    const desc = s.description ? "\n\n" + oneLine(s.description, DESC_MAX) : "";
    return `${head}${desc}\n\n${propsTable(spec, { $ref: ref }) || "_" + typeOf(spec, s) + "_"}`;
  }).join("\n\n");
}

const GEN_NOTE = "<!-- GENERATED by scripts/ezekia-sync.mjs from the live Ezekia OpenAPI spec — do not hand-edit; re-run the script. -->";

export function render(spec, { date, generatorHash = "" }) {
  const hash = canonicalHash(spec);
  const ops = collectOperations(spec);
  const current = currentSurface(ops);
  const shared = sharedRefs(spec, current);
  const files = {};

  // per-tag files
  const byTag = new Map();
  for (const o of current) for (const tag of o.tags) { if (!byTag.has(tag)) byTag.set(tag, []); byTag.get(tag).push(o); }
  const tags = [...byTag.keys()].sort();
  for (const tag of tags) {
    const list = byTag.get(tag);
    const schemaRefs = [...new Set(list.flatMap((o) => operationRefs(spec, o)))].filter((r) => !shared.schemas.has(r)).sort();
    const body = [
      GEN_NOTE, "", `# Ezekia API — ${tag}`, "",
      `Current operations for **${tag}** (${list.length}). Base URL \`https://ezekia.com/api\`; send \`Authorization: Bearer <token>\`. ` +
      "Paths below include the `/api` prefix. Shared query params and common schemas: `conventions.md`. Spec snapshot: `index.md`.",
      "", ...list.map((o) => renderOperation(spec, o, shared)).flatMap((s) => [s, ""]),
    ];
    if (schemaRefs.length) body.push("## Schemas referenced above", "", renderSchemaSection(spec, schemaRefs), "");
    files[`current/${slug(tag)}.md`] = body.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  }

  // conventions.md — shared params + schemas, auth
  const schemes = spec.components?.securitySchemes || {};
  const conv = [
    GEN_NOTE, "", "# Ezekia API — conventions (shared params, common schemas, auth)", "",
    "## Auth (as declared by the spec)", "",
    ...Object.keys(schemes).sort().map((k) => `- \`${k}\`: ${["type", "scheme", "bearerFormat", "in", "name"].filter((f) => schemes[k][f]).map((f) => `${f}=\`${schemes[k][f]}\``).join(", ")}`),
    "", `## Shared query/path parameters (used by ≥${SHARED_MIN} tags)`, "",
    ...[...shared.params].sort().map((ref) => `- **${refName(ref)}** — ${renderParam(spec, { $ref: ref })}`),
    "", `## Common schemas (used by ≥${SHARED_MIN} tags)`, "",
    renderSchemaSection(spec, [...shared.schemas].sort()), "",
  ];
  files["conventions.md"] = conv.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

  // deprecations.md — migration table
  const dep = ops.filter((o) => o.deprecated);
  // versioned current ops only: a deprecated /vN path's replacement is another version, never a version-free path
  const currentByKey = new Map(current.filter((o) => o.version !== null).map((o) => [`${o.method} ${o.rest}`, o]));
  const depRows = dep.map((o) => {
    const d = String(o.op.description || "");
    const removed = (d.match(/Removed on ([^.\n]+)/) || [, ""])[1].trim();
    const use = (d.match(/Use `([^`]+)` instead/) || [, ""])[1];
    const cur = currentByKey.get(`${o.method} ${o.rest}`);
    const repl = use || (cur ? `/api${cur.path}` : "");
    return `| \`${o.method.toUpperCase()}\` | \`/api${o.path}\` | ${cell(removed)} | ${repl ? "`" + cell(repl) + "`" : "—"} |`;
  });
  files["deprecations.md"] = [
    GEN_NOTE, "", "# Ezekia API — deprecated operations (migration table)", "",
    `${dep.length} deprecated operations. An UNVERSIONED call (e.g. \`/api/people\`) is served by v1 and is removed with it — ` +
    "migrate to the replacement shown. A later version may change the request/response shape, so check the replacement's entry under `current/` before switching.",
    "", "| method | deprecated path | removed on | replacement |", "|---|---|---|---|", ...depRows, "",
  ].join("\n");

  // index.md — snapshot pin + router
  const versions = {};
  for (const o of ops) { const v = o.version === null ? "version-free" : "v" + o.version; versions[v] ??= { total: 0, deprecated: 0 }; versions[v].total++; if (o.deprecated) versions[v].deprecated++; }
  const latest = Math.max(...ops.map((o) => o.version ?? 0));
  files["index.md"] = [
    GEN_NOTE,
    `<!-- ezekia-spec-sha256: ${hash} -->`,
    `<!-- ezekia-generator-sha256: ${generatorHash} -->`,
    TREE_PIN_SLOT,
    `<!-- ezekia-snapshot-date: ${date} -->`,
    `<!-- ezekia-spec-version: ${spec.info?.version ?? "unknown"} -->`,
    "", "# Ezekia API — reference index (generated snapshot)", "",
    `- **Spec:** ${SPEC_URL} (OpenAPI ${spec.openapi || spec.swagger}, info.version \`${spec.info?.version ?? "?"}\`) — rendered at ${DOCS_URL}`,
    `- **Snapshot:** ${date} · sha256 \`${hash.slice(0, 16)}…\` (full hash in this file's header; \`--check\` compares it)`,
    `- **Servers:** ${(spec.servers || []).map((s) => "`" + s.url + "`").join(", ") || "—"}`,
    `- **Operations:** ${ops.length} total · ${dep.length} deprecated · **${current.length} current** (highest non-deprecated version per endpoint; latest version = v${latest})`,
    "", "| version | operations | deprecated |", "|---|---|---|",
    ...Object.keys(versions).sort().map((v) => `| ${v} | ${versions[v].total} | ${versions[v].deprecated} |`),
    "", "## Current operations by tag (load the one you need)", "",
    "| tag | file | ops |", "|---|---|---|",
    ...tags.map((t) => `| ${t} | \`current/${slug(t)}.md\` | ${byTag.get(t).length} |`),
    "", "Also: `conventions.md` (auth, shared params, common schemas) · `deprecations.md` (migration table).", "",
  ].join("\n");

  files["index.md"] = files["index.md"].replace(TREE_PIN_SLOT, `<!-- ezekia-tree-sha256: ${hashTree(files)} -->`);
  return { files, hash, stats: { total: ops.length, deprecated: dep.length, current: current.length, tags: tags.length } };
}

// sha256 over every generated file in code-unit path order — index.md included, minus its pin comment lines
// (which carry this very hash), so a hand edit to the router body is drift too
const PIN_LINE = /^<!-- ezekia-[a-z0-9-]+: .* -->$/;
const TREE_PIN_SLOT = "<!-- ezekia-tree-sha256: (pending) -->";
export function hashTree(files) {
  const h = createHash("sha256");
  for (const k of Object.keys(files).sort(byCodeUnit)) {
    const text = k === "index.md" ? files[k].split("\n").filter((l) => !PIN_LINE.test(l)).join("\n") : files[k];
    h.update(k + "\0" + text + "\0");
  }
  return h.digest("hex");
}
export const generatorHash = () => createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex");

// ── IO ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export function readPins(outDir) {
  const p = join(outDir, "index.md");
  if (!existsSync(p)) return {};
  const t = readFileSync(p, "utf8");
  const pin = (k) => (t.match(new RegExp(`ezekia-${k}: (\\S+) -->`)) || [])[1] || null;
  return { spec: pin("spec-sha256"), generator: pin("generator-sha256"), tree: pin("tree-sha256"), date: pin("snapshot-date") };
}

// the on-disk generated tree: EVERY *.md under references/ (a stray extra file is drift; .DS_Store etc. are not)
export function readTree(outDir) {
  const files = {};
  const walk = (rel) => {
    for (const e of readdirSync(join(outDir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r);
      else if (e.name.endsWith(".md")) files[r] = readFileSync(join(outDir, r), "utf8");
    }
  };
  if (existsSync(outDir)) walk("");
  return files;
}

// offline integrity: the script and the on-disk tree still match the pins (no network)
export function localDrift(outDir, gen = generatorHash()) {
  const pins = readPins(outDir), problems = [];
  if (!pins.spec) return ["no pinned snapshot (references/index.md missing or unpinned) — run the generator"];
  if (pins.generator !== gen) problems.push(`generator changed since the snapshot (script sha256 ${gen.slice(0, 16)}… ≠ pinned ${String(pins.generator).slice(0, 16)}…) — regenerate`);
  const tree = hashTree(readTree(outDir));
  if (pins.tree !== tree) problems.push(`references/ differ from the pinned render (tree sha256 ${tree.slice(0, 16)}… ≠ pinned ${String(pins.tree).slice(0, 16)}…) — hand-edited or partially written; regenerate`);
  return problems;
}

export function writeTree(outDir, files) {
  // replace the generated subtree wholesale so a tag Ezekia removes disappears too
  rmSync(join(outDir, "current"), { recursive: true, force: true });
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(outDir, rel)), { recursive: true });
    writeFileSync(join(outDir, rel), text);
  }
}

function opKeys(spec) {
  return new Map(collectOperations(spec).map((o) => [`${o.method.toUpperCase()} /api${o.path}`, o.deprecated]));
}

async function loadSpec(src) {
  if (src && !/^https?:/.test(src)) return JSON.parse(readFileSync(src, "utf8"));
  const res = await fetch(src || SPEC_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`GET ${src || SPEC_URL} → HTTP ${res.status}`);
  return res.json();
}

async function main(argv) {
  const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const outDir = resolve(arg("--out") || DEFAULT_OUT);
  const gen = generatorHash();
  const check = argv.includes("--check");
  if (argv.includes("--offline") && !check) { console.error("ezekia-sync: --offline is only valid with --check (a write needs the live spec)"); return 2; }

  if (check && argv.includes("--offline")) {
    const problems = localDrift(outDir, gen);
    if (!problems.length) { console.log("ezekia-sync: offline pins OK (generator + references/ match the snapshot)"); return 0; }
    for (const p of problems) console.log(`ezekia-sync: DRIFT — ${p}`);
    return 1;
  }

  let spec;
  try { spec = await loadSpec(arg("--spec")); if (!spec?.paths) throw new Error("not an OpenAPI document (no .paths)"); }
  catch (e) { console.error(`ezekia-sync: could not load spec — ${e.message}`); return 2; }
  const pins = readPins(outDir);
  const hash = canonicalHash(spec);
  // unchanged spec + generator → keep the pinned date so a re-run is byte-identical
  const date = arg("--date") || (pins.spec === hash && pins.generator === gen && pins.date) || new Date().toISOString().slice(0, 10);
  const { files, stats } = render(spec, { date, generatorHash: gen });

  if (check) {
    const problems = localDrift(outDir, gen);
    if (pins.spec === hash && !problems.length) { console.log(`ezekia-sync: in sync (spec sha256 ${hash.slice(0, 16)}…, ${stats.current} current ops)`); return 0; }
    for (const p of problems) console.log(`ezekia-sync: DRIFT — ${p}`);
    if (pins.spec !== hash) {
      console.log(`ezekia-sync: DRIFT — live spec sha256 ${hash.slice(0, 16)}… ≠ pinned ${pins.spec ? pins.spec.slice(0, 16) + "…" : "(none)"}`);
      // best-effort op diff against the pinned snapshot's rendered operation headings
      const was = new Set();
      for (const text of Object.values(readTree(outDir))) for (const m of text.matchAll(/^### `([A-Z]+ \/api\S+)`/gm)) was.add(m[1]);
      const nowCurrent = new Set(currentSurface(collectOperations(spec)).map((o) => `${o.method.toUpperCase()} /api${o.path}`));
      const added = [...nowCurrent].filter((k) => !was.has(k)).sort(byCodeUnit), removed = [...was].filter((k) => !nowCurrent.has(k)).sort(byCodeUnit);
      const keys = opKeys(spec);
      for (const k of added) console.log(`  + ${k}`);
      for (const k of removed) console.log(`  - ${k}${keys.get(k) ? "  (now deprecated)" : keys.has(k) ? "" : "  (removed from spec)"}`);
      if (!added.length && !removed.length) console.log("  (no current-surface operation added/removed — params/schemas/descriptions changed)");
    }
    console.log("Run: pnpm ezekia:sync");
    return 1;
  }

  writeTree(outDir, files);
  console.log(`ezekia-sync: wrote ${Object.keys(files).length} files to ${outDir} — ${stats.current} current ops across ${stats.tags} tags (${stats.deprecated} deprecated tabled), spec sha256 ${hash.slice(0, 16)}…`);
  return 0;
}

// realpath BOTH sides — survives spaced and symlinked paths (a plain import.meta.url === argv[1] compare fails on both)
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
