import ContactFromQuery from "@/components/ContactFromQuery";

// ?aud= is read client-side so the page stays prerendered (no per-request render for a query string). The prerendered
// HTML is the default (candidate) form; ContactFromQuery switches the tab to match ?aud= on load and when a link changes it.
export default function ContactPage({ candidateOpen }: { candidateOpen: boolean }) {
  return <ContactFromQuery candidateOpen={candidateOpen} />;
}
