import type { Metadata } from "next";
import ContactPage from "../ContactPage";

// Served at /contact/ to visitors outside the US (src/proxy.ts); its own URL shouldn't be indexed.
export const metadata: Metadata = { title: "Contact — Banister International", robots: { index: false } };

export default function Page() {
  return <ContactPage candidateOpen={false} />;
}
