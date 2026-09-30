import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import ContactFromQuery from "@/components/ContactFromQuery";

export const metadata: Metadata = { title: "Contact — Banister International" };

// Static export: no server to read ?aud= at request time, so the query is read client-side. The fallback is the
// default (candidate) form, so the prerendered HTML is the real page, not an empty shell.
export default function ContactPage() {
  return (
    <Suspense fallback={<ContactForm initialAudience="candidate" />}>
      <ContactFromQuery />
    </Suspense>
  );
}
