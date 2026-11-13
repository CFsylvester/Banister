import { NextResponse, type NextRequest } from "next/server";
import { candidateFormOpen } from "@/lib/geo";

/** Outside the US, /contact/ serves the copy whose candidate tab is a notice instead of the form (src/lib/geo.ts). A
 * rewrite keeps both pages prerendered and the address bar unchanged, and sets no cookie. Proxy docs:
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md. */
export function proxy(request: NextRequest) {
  // Pages only: a POST here is a Server Action (the newsletter band is on every page), which must reach its route as is.
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  if (candidateFormOpen(request.headers)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/contact/outside-us/";
  return NextResponse.rewrite(url);
}

// Only the contact page. The future candidate Server Action must repeat the check itself: proxy.md warns that a
// matcher or route change can silently drop Proxy coverage of a Server Function.
export const config = { matcher: ["/contact", "/contact/"] };
