import type { Metadata } from "next";
import { CONTACT_META, pageMetadata } from "@/lib/seo";
import ContactPage from "../ContactPage";

// Served at /contact/ to visitors outside the US (src/proxy.ts), so it carries exactly the /contact/ metadata,
// canonical included. No noindex: Googlebot "crawls with IP addresses based outside the USA", and robots meta should be
// applied "consistently across locales" (https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages),
// so a noindex here would reach /contact/ itself. The canonical keeps this page's own URL out of the index instead.
export const metadata: Metadata = pageMetadata(CONTACT_META);

export default function Page() {
  return <ContactPage candidateOpen={false} />;
}
