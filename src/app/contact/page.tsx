import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import ContactFromQuery from "@/components/ContactFromQuery";

export const metadata: Metadata = { title: "Contact — Banister International" };

// ?aud= is read client-side so the page stays prerendered (no per-request render for a query string). The fallback is the
// default (candidate) form, so the prerendered HTML is the real page, not an empty shell.
export default function ContactPage() {
  return (
    <Suspense fallback={<ContactForm initialAudience="candidate" />}>
      <ContactFromQuery />
    </Suspense>
  );
}
