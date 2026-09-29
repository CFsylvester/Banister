import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact — Banister International" };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { aud } = await searchParams;
  // Keyed so the footer's "For employers" / "For candidates" links reset the form, as the design's go() does.
  return <ContactForm key={String(aud)} initialAudience={aud === "employer" ? "employer" : "candidate"} />;
}
