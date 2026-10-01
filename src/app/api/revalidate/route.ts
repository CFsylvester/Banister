// POST /api/revalidate/ — called by the Contentful webhook on publish/unpublish in the live environment.
// (trailingSlash: true makes the slash-less path 308-redirect, so the webhook is configured with the slash URL.)
// Marks every CMS-derived page stale with `{ expire: 0 }`, so the next full page load renders fresh content instead
// of one stale copy (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md,
// "Revalidation Behavior"). Decision logic: src/lib/cms/webhook.ts (unit-tested). The secret is checked BEFORE the
// body is read, so unauthenticated callers can't make the function buffer a payload.
import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/cms/source";
import { checkCaller, checkEnvironment, liveEnvironments, SECRET_HEADER, type Verdict } from "@/lib/cms/webhook.ts";

function refuse(v: Exclude<Verdict, { action: "revalidate" }>) {
  if (v.status === 500) console.error("[revalidate] REVALIDATE_SECRET is not set for this deployment");
  return Response.json({ revalidated: false, reason: v.reason }, { status: v.status });
}

export async function POST(request: Request) {
  const caller = checkCaller({
    secretHeader: request.headers.get(SECRET_HEADER),
    expectedSecret: process.env.REVALIDATE_SECRET,
    contentLength: request.headers.get("content-length"),
  });
  if (caller.action !== "revalidate") return refuse(caller);
  const env = checkEnvironment(await request.text(), liveEnvironments(process.env));
  if (env.action !== "revalidate") return refuse(env);
  revalidateTag(CMS_TAG, { expire: 0 });
  return Response.json({ revalidated: true, tag: CMS_TAG, now: Date.now() });
}
