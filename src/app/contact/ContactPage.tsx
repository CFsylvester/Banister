import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import ContactFromQuery from "@/components/ContactFromQuery";

// ?aud= is read client-side so the page stays prerendered (no per-request render for a query string). The fallback is the
// default (candidate) form, so the prerendered HTML is the real page, not an empty shell.
export default function ContactPage({ candidateOpen }: { candidateOpen: boolean }) {
  return (
    <Suspense fallback={<ContactForm initialAudience="candidate" candidateOpen={candidateOpen} />}>
      <ContactFromQuery candidateOpen={candidateOpen} />
    </Suspense>
  );
}
