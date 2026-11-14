import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import Blank from "@/components/Blank";
import { Email, H2, LegalPage, linkCls, P, Ul } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | Banister International",
  description: "How Banister International collects, uses, shares and keeps the personal information you give us through this website, and your rights over it.",
  path: "/privacy",
});

// US-only policy [Design Choice, owner 2026-11-13]: candidate submissions are accepted from the US only (src/lib/geo.ts),
// so this is written to US law and makes no EU, UK or other non-US statements. Drafted from reports/Banister privacy and
// terms findings.md ("Who receives personal data", "The consent sentence") and the owner's retention decision. Every
// sentence is a claim of fact: the FTC holds companies to their privacy promises, so cut anything Banister doesn't do.
// Where each form's data goes (epic #88, src/lib/contact/): candidates → Ezekia; employers → Ezekia plus an email to the
// team through Resend (src/lib/email). Keep these sections in step with that code.
// Section anchors (#candidates, #clients, #newsletter) are linked from the forms.

const email = <Email />;

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">

      <P>
        This policy explains what <Blank>{LEGAL.entity}</Blank> (“Banister International”, “we”, “us”) collects through this
        website, how we use it, who we share it with, how long we keep it, and the choices you have.
      </P>

      <H2>This site serves the United States</H2>
      <P>
        We accept candidate submissions from people in the United States only, and this policy is written for US visitors.
        If you are outside the US, the candidate form is not available to you. We use the country that our host, Vercel,
        works out from your IP address to decide whether to show it. We don’t store that country.
      </P>

      <H2 id="candidates">If you send us your details as a candidate</H2>
      <P>Through the candidate form we collect your name, email address, phone number, preferred contact method, your message, and your résumé if you attach one.</P>
      <Ul>
        <li><strong>Why:</strong> to reply to you and to consider you for suitable roles.</li>
        <li><strong>Where it goes:</strong> into our recruitment database, provided by Ezekia. If you are new to us, Ezekia’s software reads your résumé to build your profile; if we already have a profile for you, your résumé is added to it as a file.</li>
        <li><strong>Clients:</strong> <Blank>{LEGAL.clientSharing}</Blank></li>
        <li><strong>What to leave out:</strong> please don’t include details we don’t need, such as date of birth, photo, health, religion, ethnicity, sexual orientation, political views, Social Security number or other ID numbers.</li>
      </Ul>

      <H2 id="clients">If you contact us as an employer</H2>
      <P>
        Through the employer form we collect your name, email address, phone number, company, preferred contact method and
        message. We use them to reply to your inquiry and discuss your hiring needs, and keep them in our client database,
        provided by Ezekia. A copy is emailed to our team so a partner can reply. Please don’t include personal details about candidates or staff unless we need them.
      </P>

      <H2 id="newsletter">If you sign up for our newsletter</H2>
      <P>
        We add your email address to a sign-up list in our database, provided by Ezekia. Because that database needs a
        name, we store the part of your address before the “@” as one. If we already
        hold a record with that email address, we add the sign-up to it. We use it to send our articles and perspectives. You can unsubscribe at any time by writing to {email}.
      </P>

      <H2>Information collected automatically</H2>
      <P>
        Like any website, our host, Vercel, receives your IP address, browser details and the pages you request, and keeps
        them in its logs. We also use your IP address to limit repeated sign-up and contact-form attempts; it is held in the server’s memory
        for a short time and not written to any database or log. Images on some pages load from Contentful, our content service, which also receives your IP address. When you send the contact form, a
        check from Vercel runs in your browser and its result is sent with the form, so we can tell people from automated
        traffic.
      </P>
      <P>
        This site does not use advertising or analytics cookies. It does not collect information about your activity over
        time or across other websites, so browser “Do Not Track” signals don’t change how it works.
      </P>

      <H2>Who we share it with</H2>
      <Ul>
        <li><strong>Ezekia</strong> stores our candidate, client and newsletter records.</li>
        <li><strong>Vercel</strong> hosts this website and processes form submissions on the way to Ezekia and to Resend.</li>
        <li><strong>Resend</strong> delivers employer inquiries from the website to our team’s inbox.</li>
        <li><strong>Contentful</strong> serves the site’s content and images.</li>
        <li><strong>Our email provider</strong> carries our correspondence with you.</li>
        <li><strong>Authorities</strong>, when the law requires it, or to protect our rights.</li>
      </Ul>
      <P><Blank>{LEGAL.noSale}</Blank></P>

      <H2>How long we keep it</H2>
      <P>
        <strong>Candidates who use the website form.</strong> About once a year we’ll email you to ask whether you’d like us
        to delete your details. If you ask, we delete them. If you don’t reply, we keep them for future roles. We delete them
        after <Blank>{LEGAL.cutoffYears}</Blank> years with no contact between us.
      </P>
      <P>
        <strong>Employers and newsletter subscribers.</strong> We keep employer inquiries for <Blank>{LEGAL.employerRetention}</Blank> and
        newsletter addresses until you unsubscribe.
      </P>
      <P>Where US law requires us to keep a record for a set time, or while a legal claim is open, we keep it for that time.</P>

      <H2>Your choices</H2>
      <P>
        You can ask us at any time what we hold about you, to correct it, or to delete it, by writing to {email}. We may need
        to confirm it’s you before acting, and some records we may have to keep by law. You can unsubscribe from our
        newsletter at any time.
      </P>

      <H2>Security</H2>
      <P>
        We take reasonable steps to protect the information we hold. No system is perfectly secure; if a breach affects your
        information, we will tell you as the law requires.
      </P>

      <H2>Children</H2>
      <P>This site is not meant for children under 13, and we don’t knowingly collect their information.</P>

      <H2>Changes to this policy</H2>
      <P>When we change this policy we’ll post the new version here and update the effective date above.</P>

      <H2>Contact us</H2>
      <P>
        <Blank>{LEGAL.entity}</Blank>, <Blank>{LEGAL.postalAddress}</Blank>. Email {email}, or use our{" "}
        <Link href="/contact/" className={linkCls}>contact form</Link>.
      </P>
    </LegalPage>
  );
}
