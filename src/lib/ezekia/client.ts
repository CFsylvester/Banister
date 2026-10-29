// Ezekia v4 client. Pure (no server-only import) so it is unit-testable and usable from scripts; app code imports
// ./index.ts, which adds `server-only` and reads EZEKIA_API_TOKEN. Endpoint shapes come from the repo skill
// (.claude/skills/ezekia-api, spec 2.1.1) — look them up there rather than guessing.
//
// Request rules (Ezekia support, email to Banister, Oct 2026; spec `api.bearer`):
// - `Authorization: Bearer <token>` and `Accept: application/json` on every call; `Content-Type: application/json`
//   on everything except multipart, where fetch sets the boundary itself.
// - 5 requests/second per API user; over that → 429 with `Retry-After`. We retry in-request only (no queue): the
//   callers are a Server Action and a portal upload, so waits are capped to keep them responsive.
// - Deprecated API versions send a `Sunset` header; we warn once, never fail.
import {
  EzekiaAuthError, EzekiaConflictError, EzekiaError, EzekiaNotFoundError, EzekiaRateLimitError,
  EzekiaUpstreamError, EzekiaValidationError,
} from "./errors.ts";

export const EZEKIA_BASE_URL = "https://ezekia.com/api/v4";

export type EzekiaEmail = { id: number; address: string; isDefault?: boolean };
export type EzekiaPhone = { id: number; number: string; isDefault?: boolean };
/** The subset of `api.v4.person.default` we read. */
export type EzekiaPerson = {
  id: number; firstName?: string; lastName?: string; fullName?: string;
  emails?: EzekiaEmail[]; phones?: EzekiaPhone[]; updatedAt?: string;
};
export type EzekiaDocument = { id: number; filename?: string; personId?: number };
export type CvOptions = { ownerId?: number; lists?: number[]; projectId?: number; projectType?: "assignment" | "opportunity" | "list" };

export type ClientOptions = {
  token: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Structured, PII-free request log (method, route template, status, ms). Defaults to no-op. */
  log?: (entry: { method: string; route: string; status: number | null; ms: number }) => void;
  warn?: (message: string) => void;
  /** Total time one call may spend waiting on 429s before giving up. */
  maxRetryWaitMs?: number;
  /** Per-attempt timeout. CV uploads are parsed by Ezekia, so keep it generous. */
  timeoutMs?: number;
};

const MAX_429_RETRIES = 3;
const DEFAULT_RETRY_MS = 1000; // no Retry-After → wait one rate-limit window (5 req/s) [Design Choice]
const MIN_RETRY_MS = 200; // Retry-After 0 / a past date still backs off a little [Design Choice]
const UPSTREAM_RETRY_MS = 500;
// Connection failures where the request never reached Ezekia, so even a POST is safe to resend. Node's fetch puts the
// system error on `err.cause.code`: ECONNREFUSED (closed port) and ENOTFOUND (bad host) observed on Node 22.23.3;
// EAI_AGAIN (DNS timeout) [unverified]. A timeout (`TimeoutError`) has no code, so a POST that times out is not resent.
const NOT_SENT_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

// IMF-fixdate, the HTTP-date form senders must use (RFC 9110 §5.6.7: https://www.rfc-editor.org/rfc/rfc9110#http.date).
// Checked before Date.parse, which also accepts non-dates such as "1.5".
const IMF_FIXDATE = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/;

/** `Retry-After` is delay-seconds or an HTTP-date (RFC 9110 §10.2.3: https://www.rfc-editor.org/rfc/rfc9110#field.retry-after). */
export function parseRetryAfter(value: string | null, nowMs: number): number | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  if (!IMF_FIXDATE.test(v)) return null;
  return Math.max(0, Date.parse(v) - nowMs);
}

type Call = { method: "GET" | "POST" | "PUT"; route: string; params?: Record<string, number>; query?: URLSearchParams; json?: unknown; form?: FormData };

export function createEzekiaClient(opts: ClientOptions) {
  if (!opts.token) throw new Error("Ezekia client: missing API token (EZEKIA_API_TOKEN)");
  const base = opts.baseUrl ?? EZEKIA_BASE_URL;
  const doFetch = opts.fetch ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? ((m: string) => console.warn(m));
  const maxWait = opts.maxRetryWaitMs ?? 10_000;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  let sunsetWarned = false;

  async function call<T>({ method, route, params = {}, query, json, form }: Call): Promise<T> {
    const label = `${method} ${route}`;
    const path = route.replace(/\{(\w+)\}/g, (_, k: string) => {
      const v = Object.hasOwn(params, k) ? params[k] : undefined;
      if (!Number.isInteger(v) || (v as number) <= 0) throw new Error(`Ezekia client: path param ${k} for ${route} must be a positive integer id`);
      return encodeURIComponent(String(v));
    });
    const url = `${base}${path}${query && [...query].length ? `?${query}` : ""}`;
    const headers: Record<string, string> = { Authorization: `Bearer ${opts.token}`, Accept: "application/json" };
    if (!form) headers["Content-Type"] = "application/json";
    const body = form ?? (json === undefined ? undefined : JSON.stringify(json));
    // Repeating a GET or PUT is harmless. A POST creates something (a person, document, email, note), so after a
    // 5xx or a dropped connection Ezekia may already have done it: only resend when it certainly didn't land.
    const idempotent = method !== "POST";

    let waited = 0, rateRetries = 0, upstreamRetried = false;
    for (;;) {
      const started = now();
      let res: Response;
      try {
        res = await doFetch(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMs) });
      } catch (err) {
        log({ method, route, status: null, ms: now() - started });
        const code = (err as { cause?: { code?: string } })?.cause?.code;
        const notSent = !!code && NOT_SENT_CODES.has(code);
        if (!upstreamRetried && (idempotent || notSent)) { upstreamRetried = true; await sleep(UPSTREAM_RETRY_MS); continue; }
        throw new EzekiaUpstreamError(label, null, { cause: err });
      }
      log({ method, route, status: res.status, ms: now() - started });
      if (res.headers.get("sunset") && !sunsetWarned) {
        sunsetWarned = true;
        warn(`Ezekia: ${label} returned Sunset: ${res.headers.get("sunset")} — this API version is being retired`);
      }
      // The timeout signal also covers reading the body. Ezekia has already answered by then, so a stall here is never
      // retried; it surfaces as an upstream error instead of a raw TimeoutError.
      const readBody = async () => {
        try { return await res.text(); } catch (err) { throw new EzekiaUpstreamError(label, res.status, { cause: err }); }
      };
      if (res.ok) {
        if (res.status === 204) return undefined as T;
        const text = await readBody();
        // Every endpoint this client calls documents a 200 body, so an empty one is an Ezekia fault, not "no data".
        if (!text) throw new EzekiaError(label, res.status, "empty response");
        // Never surface the parser's message: it quotes the response body, which may hold personal data.
        try { return JSON.parse(text) as T; } catch { throw new EzekiaError(label, res.status, "response was not valid JSON"); }
      }

      if (res.status === 429) {
        const after = parseRetryAfter(res.headers.get("retry-after"), now());
        const wait = Math.max(after ?? DEFAULT_RETRY_MS, MIN_RETRY_MS);
        if (rateRetries < MAX_429_RETRIES && waited + wait <= maxWait) {
          rateRetries++; waited += wait; await sleep(wait); continue;
        }
        throw new EzekiaRateLimitError(label, after);
      }
      if (res.status >= 500) {
        // 503 = the server refused the request without acting on it, so a POST may retry on that one too [Design Choice].
        if (!upstreamRetried && (idempotent || res.status === 503)) { upstreamRetried = true; await sleep(UPSTREAM_RETRY_MS); continue; }
        throw new EzekiaUpstreamError(label, res.status);
      }
      if (res.status === 401 || res.status === 403) throw new EzekiaAuthError(label, res.status);
      if (res.status === 404) throw new EzekiaNotFoundError(label);
      if (res.status === 409) throw new EzekiaConflictError(label);
      if (res.status === 422) {
        let errors: Record<string, unknown> = {};
        try { errors = (JSON.parse(await readBody()) as { errors?: Record<string, unknown> }).errors ?? {}; }
        catch (e) { if (e instanceof EzekiaUpstreamError) throw e; } // unparseable 422 body → validation error, no field list
        throw new EzekiaValidationError(label, errors);
      }
      throw new EzekiaError(label, res.status);
    }
  }

  const sameEmail = (a: string | undefined, b: string) => !!a && a.trim().toLowerCase() === b.trim().toLowerCase();
  const fileForm = (field: string, file: Blob, filename: string) => { const f = new FormData(); f.append(field, file, filename); return f; };

  return {
    /** `GET /me` → the token's API user. Cheapest authenticated call; use it to check a token. */
    me: () => call<{ id: number; email: string; fullName: string }>({ method: "GET", route: "/me" }),

    /**
     * People whose email matches exactly (case-insensitive). The search (`query` + `filterOn[]=email`) is
     * re-checked client-side so a looser server match never picks the wrong record. Most recently updated first.
     */
    async findPeopleByEmail(email: string): Promise<EzekiaPerson[]> {
      const q = new URLSearchParams({ query: email.trim(), count: "50" });
      q.append("filterOn[]", "email");
      const res = await call<{ data: EzekiaPerson[] }>({ method: "GET", route: "/people", query: q });
      return res.data
        .filter((p) => p.emails?.some((e) => sameEmail(e.address, email)))
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    },

    /**
     * `POST /people` as multipart `resume` (spec body `api.person.storeFile`): Ezekia creates the person and parses
     * the CV itself (help-centre "API Integration": https://ezekia.freshdesk.com/support/solutions/articles/101000510621-api-integration).
     * Only for NEW people — sending a CV to an existing person's update "will replace existing data with that from
     * the CV" (same article), so use addDocument() for them instead.
     */
    async createPersonFromCv(file: Blob, filename: string, o: CvOptions = {}): Promise<EzekiaPerson> {
      const form = fileForm("resume", file, filename);
      if (o.ownerId !== undefined) form.append("ownerId", String(o.ownerId));
      for (const id of o.lists ?? []) form.append("lists[]", String(id));
      if (o.projectId !== undefined) form.append("projectId", String(o.projectId));
      if (o.projectType) form.append("projectType", o.projectType);
      return (await call<{ data: EzekiaPerson }>({ method: "POST", route: "/people", form })).data;
    },

    /**
     * `POST /people` JSON (`api.v4.person.store`) for a person with no CV. The spec says `companyName` is "Required if
     * `companyRecordName` or `companyRecordId` are not set" [unverified whether Ezekia enforces it — check on a test record].
     */
    async createPerson(p: { firstName: string; lastName: string; email?: string; phone?: string; companyName?: string }): Promise<EzekiaPerson> {
      const json = {
        firstName: p.firstName, lastName: p.lastName,
        ...(p.companyName ? { companyName: p.companyName } : {}),
        // emails[]/phones[] are untyped `object[]` in the spec; these keys mirror the emails/phones sub-endpoints'
        // store bodies (`address`, `number`, `isDefault`). [unverified] that create accepts them — check on a test record.
        ...(p.email ? { emails: [{ address: p.email, isDefault: true }] } : {}),
        ...(p.phone ? { phones: [{ number: p.phone, isDefault: true }] } : {}),
      };
      return (await call<{ data: EzekiaPerson }>({ method: "POST", route: "/people", json })).data;
    },

    /**
     * `PUT /people/{id}` with names only. The spec marks firstName + lastName required on update. Emails and phones
     * are deliberately NOT sent here: whether a PUT `emails[]`/`phones[]` replaces the person's existing list is
     * undocumented, so use addEmail()/addPhone(), which only ever add.
     */
    async updatePersonNames(id: number, names: { firstName: string; lastName: string }): Promise<EzekiaPerson> {
      return (await call<{ data: EzekiaPerson }>({ method: "PUT", route: "/people/{id}", params: { id }, json: names })).data;
    },

    /** `POST /people/{id}/emails` (`api.person.emailStoreRequest`). */
    async addEmail(personId: number, address: string, isDefault = false): Promise<EzekiaEmail> {
      return (await call<{ data: EzekiaEmail }>({ method: "POST", route: "/people/{id}/emails", params: { id: personId }, json: { address, isDefault } })).data;
    },

    /** `POST /people/{id}/phones` (`api.person.phoneStoreRequest`). */
    async addPhone(personId: number, number: string, isDefault = false): Promise<EzekiaPhone> {
      return (await call<{ data: EzekiaPhone }>({ method: "POST", route: "/people/{id}/phones", params: { id: personId }, json: { number, isDefault } })).data;
    },

    /** `POST /people/{id}/documents` multipart `files[]` — attaches a file WITHOUT re-parsing the profile. Returns `api.document`. */
    addDocument: (personId: number, file: Blob, filename: string) =>
      call<EzekiaDocument>({ method: "POST", route: "/people/{id}/documents", params: { id: personId }, form: fileForm("files[]", file, filename) }),

    /** `POST /people/notes` — one note on one or more people. Returns `{ updated, notUpdated }`. */
    addNote: (personIds: number[], noteText: string) =>
      call<{ updated: unknown[]; notUpdated: unknown[] }>({ method: "POST", route: "/people/notes", json: { people: personIds, noteText } }),
  };
}

export type EzekiaClient = ReturnType<typeof createEzekiaClient>;
