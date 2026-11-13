import type { Metadata } from "next";
import { CONTACT_META, pageMetadata } from "@/lib/seo";
import ContactPage from "./ContactPage";

export const metadata: Metadata = pageMetadata(CONTACT_META);

// The US copy. Requests from elsewhere are rewritten to ./outside-us by src/proxy.ts.
export default function Page() {
  return <ContactPage candidateOpen />;
}
