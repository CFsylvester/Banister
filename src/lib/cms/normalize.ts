// Normalization: Contentful SDK objects and fixture records → the plain CmsEntry / CmsAsset shapes (./types.ts).
// Pure (no server-only import) so it is unit-testable; used by ./source.ts.
import type { CmsAsset, CmsEntry } from "./types.ts";

export type Sys = { type?: string; id?: string; linkType?: string; contentType?: { sys: { id: string } } };
export type Node = { sys?: Sys; fields?: Record<string, unknown>; nodeType?: string };

// `path` holds the entry IDs on the current branch: references can loop (page → hero → button → page), so an
// entry already on the path is returned with its plain fields only (enough for e.g. a slug), not expanded again.
export function normalize(v: unknown, resolveLink: (sys: Sys) => unknown, path: ReadonlySet<string> = new Set()): unknown {
  if (Array.isArray(v)) return v.map((x) => normalize(x, resolveLink, path)).filter((x) => x !== undefined);
  if (!v || typeof v !== "object") return v;
  const n = v as Node;
  if (typeof n.nodeType === "string") return normalizeRichText(n as RichNode, resolveLink, path); // rich text
  if (n.sys?.type === "Link") return normalize(resolveLink(n.sys), resolveLink, path);
  if (n.sys?.type === "Asset") {
    const f = n.fields as { title?: string; description?: string; file?: { contentType?: string } };
    return { id: n.sys.id!, title: f.title ?? "", description: f.description ?? "", contentType: f.file?.contentType ?? "" } satisfies CmsAsset;
  }
  if (n.sys?.type === "Entry") {
    const id = n.sys.id!, seen = path.has(id), next = new Set(path).add(id);
    const fields: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(n.fields ?? {})) {
      if (!seen) fields[k] = normalize(fv, resolveLink, next);
      else if (fv === null || typeof fv !== "object") fields[k] = fv; // cycle: scalars only
    }
    return { id, contentType: n.sys.contentType!.sys.id, fields } satisfies CmsEntry<unknown>;
  }
  return v;
}

// Rich text: keep the tree, but resolve + normalize embedded entries in data.target (buttons in hero titles).
type RichNode = { nodeType: string; data?: { target?: unknown }; content?: RichNode[] };
function normalizeRichText(n: RichNode, resolveLink: (sys: Sys) => unknown, path: ReadonlySet<string>): RichNode {
  const data = n.data?.target ? { ...n.data, target: normalize(n.data.target, resolveLink, path) } : n.data;
  return { ...n, data: data ?? {}, ...(n.content ? { content: n.content.map((c) => normalizeRichText(c, resolveLink, path)) } : {}) };
}

