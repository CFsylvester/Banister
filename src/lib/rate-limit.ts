// In-memory, fixed-window rate limiting. Pure (no server-only import) so it is unit-testable; the sign-up Server
// Action is the caller. Counters live in one function instance: Vercel shares an instance's global state between its
// concurrent invocations (https://vercel.com/docs/fundamentals/what-is-compute), but starts more instances under load
// and documents no instance lifetime, so this limits bursts and is not a global quota. full() and hit() are synchronous,
// so a caller that uses them without awaiting in between can't race another invocation.
import { isIP } from "node:net";

export type RateLimitOptions = { limit: number; windowMs: number; maxKeys?: number; now?: () => number };

/** `limit` hits per key per window. A burst across a window boundary can reach twice that. */
export function createRateLimiter({ limit, windowMs, maxKeys = 10_000, now = Date.now }: RateLimitOptions) {
  // Every entry lives for the same windowMs and is re-inserted when its window restarts, so Map order is expiry order.
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    /** True if `key` has used its limit in the current window. Doesn't count as a hit. */
    full(key: string): boolean {
      const w = windows.get(key);
      return !!w && now() < w.resetAt && w.count >= limit;
    },
    hit(key: string): void {
      const t = now();
      const current = windows.get(key);
      if (current && t < current.resetAt) { current.count++; return; }
      for (const [k, w] of windows) {
        // Drop expired counters (including this key's), then the oldest if still at maxKeys. Many addresses can flush the oldest counters, but
        // can't grow memory (keys are short: clientIpKey only returns validated addresses).
        if (t < w.resetAt && windows.size < maxKeys) break;
        windows.delete(k);
      }
      windows.set(key, { count: 1, resetAt: t + windowMs });
    },
    get size() { return windows.size; },
  };
}

/** The rate-limit key for a request: the client's IPv4 address, or the /64 of its IPv6 address. An end site gets at least
 * a /64 (RFC 6177: https://www.rfc-editor.org/rfc/rfc6177), so this stops rotation within one; a holder of a larger
 * block can still rotate between /64s, which only the shared cap limits. Vercel overwrites x-forwarded-for with the
 * client's public IP "to prevent IP spoofing" (https://vercel.com/docs/headers/request-headers); it is only trustworthy
 * behind a host that does. A missing or malformed IP shares one "unknown" key. */
export function clientIpKey(headers: Pick<Headers, "get">): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim().toLowerCase() ?? "";
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) return "unknown";
  if (ip.startsWith("::ffff:")) return ip.slice("::ffff:".length); // an IPv4 address in IPv6 form
  const [head, tail] = ip.split("%")[0].split("::").map((part) => part.split(":").filter(Boolean));
  const zeros = Array(Math.max(0, 8 - head.length - (tail?.length ?? 0))).fill("0");
  return `${[...head, ...zeros, ...(tail ?? [])].slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}
