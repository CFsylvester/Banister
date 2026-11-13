import type { Metadata } from "next";
import Link from "next/link";
import Blank from "@/components/Blank";
import { Email, H2, LegalPage, linkCls, P, Ul } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms and Conditions — Banister International" };

// Same URL as the live WordPress site (#36). Short, plain-language terms for a site that sells nothing, drafted from
// research_notes/Privacy page and cookie consent/terms_and_conditions.md ("Clause checklist"). Deliberately left out,
// because that research says they need counsel or facts not yet confirmed: governing law and forum, arbitration, user
// indemnity, "no fees to candidates", licence or regulatory statements, an AI-training reservation, and SMS terms.
// A footer link probably binds no casual US visitor (same file, section 2), so this reads as notices, not a contract.

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions">
      <P>
        These terms explain how you may use this website, run by <Blank>{LEGAL.entity}</Blank> (“Banister International”,
        “we”, “us”). How we handle personal information is covered by our{" "}
        <Link href="/privacy/" className={linkCls}>Privacy Policy</Link>.
      </P>

      <H2 id="legal-notice">Who we are</H2>
      <P>
        <Blank>{LEGAL.entity}</Blank>
        <br /><Blank>{LEGAL.postalAddress}</Blank>
        <br />Email: <Email />
      </P>

      <H2>Information on this site</H2>
      <P>
        The content on this site, including our insights articles, is general information about our firm and the markets
        we work in. It isn’t legal, financial or career advice, and articles reflect our view on the date they were
        published. We work to keep the site accurate but can’t promise that everything on it is complete or current.
      </P>

      <H2>Contacting us and sending your résumé</H2>
      <Ul>
        <li>Sending us an inquiry or a résumé doesn’t create an employment, agency or client relationship, and doesn’t guarantee that we’ll contact you or put you forward for a role.</li>
        <li>We accept candidate submissions from people in the United States only.</li>
        <li>Please send only information that is accurate and your own. Only include other people’s details, such as referees, if they know you’re sharing them.</li>
        <li>The terms of any search we carry out for an employer are set in a separate written agreement with that employer, not on this site.</li>
      </Ul>

      <H2>Our content</H2>
      <P>
        The text, images, logos and design of this site belong to Banister International or the people who licensed them to
        us. You’re welcome to read, print and share pages and articles for your own use, as long as you credit Banister
        International and link back to the original. Please don’t copy, republish or sell our content otherwise without our
        written permission.
      </P>

      <H2>Using the site</H2>
      <P>
        Please don’t misuse this site: for example, don’t try to break or overload it, get around its security, send
        automated or bulk submissions through its forms, or use it to send anything unlawful or harmful.
      </P>

      <H2>Links to other sites</H2>
      <P>
        Where we link to other websites, we do so for your convenience. We don’t control those sites and aren’t
        responsible for their content or how they handle your information.
      </P>

      <H2>The site is provided “as is”</H2>
      <P>
        We provide this site as it is and as available, and we can’t promise it will always be uninterrupted or error free.
        Nothing in these terms limits any right you have, or any responsibility we have, that the law doesn’t allow to be
        limited.
      </P>

      <H2>Accessibility</H2>
      <P>
        If you have trouble using any part of this site, including our contact form, email <Email /> and we’ll help you
        another way.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        If we change these terms, we’ll post the new version on this page with a new effective date. The version on this page
        is the one that applies.
      </P>

      <H2>Contact us</H2>
      <P>
        Questions about these terms? Email <Email /> or use our <Link href="/contact/" className={linkCls}>contact page</Link>.
      </P>
    </LegalPage>
  );
}
