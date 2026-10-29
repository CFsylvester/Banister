// Typed Ezekia API failures. Messages carry method + route template + status only — never request bodies, tokens or
// personal data — so callers can log them as-is.
// No TS parameter properties here: Node's strip-only type mode (used by `pnpm test`) rejects them.

export class EzekiaError extends Error {
  readonly status: number | null; // null = no HTTP response (network failure)
  readonly route: string;
  constructor(route: string, status: number | null, detail?: string, options?: { cause?: unknown }) {
    super(`Ezekia ${route} → ${status ?? "network error"}${detail ? `: ${detail}` : ""}`, options);
    this.name = "EzekiaError";
    this.route = route;
    this.status = status;
  }
}

/** 401/403: bad, expired or revoked token, or the API user's permissions group doesn't allow the call. */
export class EzekiaAuthError extends EzekiaError {
  constructor(route: string, status: number) { super(route, status); this.name = "EzekiaAuthError"; }
}

export class EzekiaNotFoundError extends EzekiaError {
  constructor(route: string) { super(route, 404); this.name = "EzekiaNotFoundError"; }
}

/** 409 Conflict. Ezekia returns it for `strict=1` person updates whose email belongs to someone else (Ezekia support,
 * Oct 2026); this client doesn't send `strict=1`, so it is mapped for completeness. */
export class EzekiaConflictError extends EzekiaError {
  constructor(route: string) { super(route, 409); this.name = "EzekiaConflictError"; }
}

/** 422 `{ message, errors }` (spec schema `api.422`). `errors` may echo submitted values: don't log it. */
export class EzekiaValidationError extends EzekiaError {
  readonly errors: Record<string, unknown>;
  constructor(route: string, errors: Record<string, unknown>) {
    super(route, 422, `invalid fields: ${Object.keys(errors).join(", ") || "unknown"}`);
    this.name = "EzekiaValidationError";
    this.errors = errors;
  }
}

/** 429 after the in-request retries ran out. `retryAfterMs` is Ezekia's last `Retry-After`, if it sent one. */
export class EzekiaRateLimitError extends EzekiaError {
  readonly retryAfterMs: number | null;
  constructor(route: string, retryAfterMs: number | null) {
    super(route, 429);
    this.name = "EzekiaRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/** 5xx, a network failure or a timeout, after any safe retry. A network failure keeps the original error as `cause`. */
export class EzekiaUpstreamError extends EzekiaError {
  constructor(route: string, status: number | null, options?: { cause?: unknown }) {
    super(route, status, undefined, options);
    this.name = "EzekiaUpstreamError";
  }
}
