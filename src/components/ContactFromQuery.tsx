"use client";
import { useSearchParams } from "next/navigation";
import ContactForm from "./ContactForm";

/** Reads ?aud=employer|candidate (the footer deep links). Keyed so switching audience via a link resets the form. */
export default function ContactFromQuery() {
  const aud = useSearchParams().get("aud");
  return <ContactForm key={String(aud)} initialAudience={aud === "employer" ? "employer" : "candidate"} />;
}
