// POST /api/revalidate — called by the Contentful webhook on publish/unpublish in the live environment.
// Marks every CMS-derived page stale with `{ expire: 0 }`, so the very next request renders fresh content instead
// of serving one stale copy (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md,
// "Revalidation Behavior"). The decision logic lives in src/lib/cms/webhook.ts (unit-tested).
import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/cms/source";
import { judgeWebhook, SECRET_HEADER } from "@/lib/cms/webhook.ts";

export async function POST(request: Request) {
  const verdict = judgeWebhook({
    secretHeader: request.headers.get(SECRET_HEADER),
    expectedSecret: process.env.REVALIDATE_SECRET,
    rawBody: await request.text(),
    expectedEnv: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });
  if (verdict.action !== "revalidate") return Response.json({ revalidated: false, reason: verdict.reason }, { status: verdict.status });
  revalidateTag(CMS_TAG, { expire: 0 });
  return Response.json({ revalidated: true, tag: CMS_TAG, now: Date.now() });
}
