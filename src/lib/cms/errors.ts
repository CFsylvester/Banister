import type { CmsEntry } from "./types.ts";

/** A content problem that must fail the build, naming the entry and field (spec FR-017). */
// No TS parameter properties here: Node's strip-only type mode (used by `pnpm test`) rejects them.
export class ContentError extends Error {
  readonly contentType: string;
  readonly entryId: string;
  readonly field: string;
  constructor(contentType: string, entryId: string, field: string, detail = "is required") {
    super(`Content error: ${contentType}/${entryId}.${field} ${detail}`);
    this.name = "ContentError";
    this.contentType = contentType;
    this.entryId = entryId;
    this.field = field;
  }
}

/** Return a required field's value or throw a ContentError. Empty strings and empty lists count as missing. */
export function required<F, K extends keyof F>(entry: CmsEntry<F>, field: K): NonNullable<F[K]> {
  const v = entry.fields[field];
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
    throw new ContentError(entry.contentType, entry.id, String(field));
  return v as NonNullable<F[K]>;
}
