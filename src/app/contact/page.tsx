import type { Metadata } from "next";
import ContactPage from "./ContactPage";

export const metadata: Metadata = { title: "Contact — Banister International" };

// The US copy. Requests from elsewhere are rewritten to ./outside-us by src/proxy.ts.
export default function Page() {
  return <ContactPage candidateOpen />;
}
