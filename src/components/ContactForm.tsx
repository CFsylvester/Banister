"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { submitContact } from "@/app/actions/contact";
import { AUDIENCE_FIELD, CONTACT_HONEYPOT, GENERIC_ERROR } from "@/lib/contact/fields";
import { MAX_RESUME_BYTES, RESUME_HELP } from "@/lib/contact/resume";
import { LEGAL } from "@/lib/legal";
import Blank from "./Blank";
import { Arrow, Check, NavyCta } from "./ui";

export type Audience = "candidate" | "employer";

const field = "box-border h-12 border border-field bg-white p-3 text-[16px] outline-teal";
const label = "flex flex-col gap-2 text-[14px] font-semibold text-navy";

const link = "font-semibold text-navy underline";

/** `candidateOpen` is false outside the US (src/lib/geo.ts): the candidate tab then shows a notice and no form, so no
 * candidate data or file field reaches a non-US visitor. The tab shown is `aud`, owned by ContactFromQuery so a ?aud= link
 * can be compared with what is on screen; the tabs report clicks through `onAudChange`. */
export default function ContactForm({ aud, onAudChange: setAud, candidateOpen }: { aud: Audience; onAudChange: (aud: Audience) => void; candidateOpen: boolean }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [who, setWho] = useState({ name: "", email: "" });
  const [file, setFile] = useState<string | null>(null);
  // Phone is only needed when it's the chosen contact method (data minimisation; report item D5).
  const [method, setMethod] = useState<"Email" | "Phone">("Email");
  // Shown above SUBMIT after a failed send. Rendered only when set, so the form's resting layout is unchanged.
  const [err, setErr] = useState<string | null>(null);
  // Ref, not state: blocks a second submit in the same tick, before React re-renders with `sending`.
  const inFlight = useRef(false);
  const employerTab = useRef<HTMLButtonElement>(null);
  const isCan = aud === "candidate";

  // The thank-you appears only when the server says every write succeeded (epic #88, FR-1). On failure the form keeps
  // everything typed, including the chosen file, because it is never reset or re-rendered without its inputs (FR-2).
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlight.current) return;
    const fd = new FormData(e.currentTarget);
    // Checked here too so a too-big file gets the friendly message instead of the server's body-size refusal.
    const cv = fd.get("resume");
    if (cv instanceof File && cv.size > MAX_RESUME_BYTES) { setErr(RESUME_HELP); return; }
    inFlight.current = true;
    setErr(null);
    setSending(true);
    const res = await submitContact(fd).catch(() => ({ ok: false as const, error: GENERIC_ERROR }));
    inFlight.current = false;
    setSending(false);
    if (!res.ok) { setErr(res.error); return; }
    setWho({ name: String(fd.get("first") || "").trim(), email: String(fd.get("email") || "").trim() });
    setSent(true);
  };

  const tab = (on: boolean) => ({ background: on ? "#edeff2" : "#fff", borderTopColor: on ? "#003f5e" : "transparent" });

  return (
    <section className="px-gutter mx-auto max-w-[920px] pt-[clamp(48px,6vw,72px)] pb-[clamp(64px,7vw,96px)]">
      <h1 className="m-0 mb-3 text-[clamp(32px,3.4vw,44px)] font-bold text-navy">Contact</h1>
      <p className="m-0 mb-9 min-h-[calc(1.65em*2)] max-w-[600px] text-[17px] leading-[1.65]">
        {isCan && !candidateOpen ? "We work with candidates in the United States and with employers everywhere." : isCan ? "Share your background and the kind of role you’re looking for. We share your details with a client only after you agree." : "Tell us about the role or the change ahead, and a partner will respond personally."}
      </p>
      <div className="flex gap-1" role="tablist" aria-label="I am">
        {(["candidate", "employer"] as const).map((a) => (
          <button key={a} ref={a === "employer" ? employerTab : undefined} type="button" role="tab" aria-selected={aud === a} onClick={() => setAud(a)}
            className="m-0 cursor-pointer border-0 border-t-3 px-[22px] py-[14px] text-[13px] font-bold tracking-[.06em] text-navy" style={tab(aud === a)}>
            {a === "candidate" ? "FOR CANDIDATES" : "FOR EMPLOYERS"}
          </button>
        ))}
      </div>
      {isCan && !candidateOpen ? (
        <div className="bg-fog p-[clamp(24px,4vw,44px)]">
          <h2 className="m-0 mb-3 text-[clamp(22px,2.2vw,26px)] font-bold text-navy">Candidate submissions are open to the United States only</h2>
          <p className="m-0 max-w-[600px] text-[17px] leading-[1.65]">
            We currently accept candidate inquiries and résumés from people in the United States only. If you’re hiring, the{" "}
            <button type="button" onClick={() => { setAud("employer"); employerTab.current?.focus(); }} className={`${link} cursor-pointer border-0 bg-transparent p-0 text-[17px]`}>employer form</button>{" "}
            is open wherever you are. See our <Link href="/privacy/" className={link}>Privacy Policy</Link>.
          </p>
        </div>
      ) : (
      <div className="grid bg-fog p-[clamp(24px,4vw,44px)]">
        <div className="flex w-full max-w-[520px] flex-col items-center gap-[18px] self-center justify-self-center py-6 text-center [grid-area:1/1]"
          role="status" aria-hidden={!sent}
          style={{ visibility: sent ? "visible" : "hidden", opacity: sent ? 1 : 0, transform: sent ? "none" : "translateY(12px)", transition: "opacity .5s ease .15s, transform .6s cubic-bezier(.2,.8,.2,1) .15s" }}>
          {sent && (
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-navy text-[32px] font-extrabold text-gold"
              style={{ animation: "bnPop .55s cubic-bezier(.2,.9,.3,1.3) .3s both" }}><Check /></span>
          )}
          <h2 className="mx-0 mt-1.5 mb-0 text-[clamp(28px,3vw,36px)] leading-[1.15] font-bold tracking-[-.01em] text-navy">
            {who.name ? `Thank you, ${who.name}.` : "Thank you."}
          </h2>
          <p className="m-0 text-[17px] leading-[1.65] text-pretty text-ink">
            {who.email ? `Your message is with our team. A partner will reply to ${who.email} within two business days.` : "Your message is with our team. A partner will reply within two business days."}
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-x-7 gap-y-3.5">
            <NavyCta href="/">BACK TO HOME</NavyCta>
          </div>
        </div>
        <form onSubmit={submit} inert={sent}
          className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-7 gap-y-[22px] [grid-area:1/1]"
          style={{ visibility: sent ? "hidden" : "visible", opacity: sent ? 0 : 1, transform: sent ? "translateY(-8px)" : "none", transition: `opacity .35s ease, transform .4s ease, visibility 0s linear ${sent ? ".35s" : "0s"}` }}>
          {/* Not grid items: a hidden input and a display:none honeypot take no space. The honeypot catches bots that
              fill every field; it is hidden from people and assistive tech. */}
          <input type="hidden" name={AUDIENCE_FIELD} value={aud} />
          <input type="text" name={CONTACT_HONEYPOT} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <label className={label}>First name<input name="first" required autoComplete="given-name" className={field} /></label>
          <label className={label}>Last name<input name="last" required autoComplete="family-name" className={field} /></label>
          <label className={label}>Email address<input name="email" type="email" required autoComplete="email" className={field} /></label>
          <label className={label}><span>Phone{method === "Email" && <span className="text-[13px] font-normal text-slate"> (optional)</span>}</span><input name="phone" type="tel" required={method === "Phone"} autoComplete="tel" className={field} /></label>
          {isCan ? (
            <label className={`${label} cursor-pointer`}>
              <span>Upload résumé <span className="text-[13px] font-normal text-slate">(PDF or Word, max 4 MB)</span></span>
              <span className="box-border flex h-12 items-stretch border border-field bg-white">
                <span className="flex flex-none items-center bg-navy px-[18px] text-[12.5px] font-bold tracking-[.06em] text-white hover:bg-navy-hover">CHOOSE FILE</span>
                <span className="flex min-w-0 flex-1 items-center overflow-hidden px-3.5 text-[14px] font-normal text-ellipsis whitespace-nowrap" style={{ color: file ? "#003f5e" : "#6a7276" }}>{file || "No file chosen"}</span>
              </span>
              <input type="file" name="resume" accept=".pdf,.doc,.docx" aria-describedby="resume-note" onChange={(e) => setFile(e.target.files?.[0]?.name || null)}
                className="pointer-events-none absolute h-px w-px opacity-0" />
              <span id="resume-note" className="text-[13px] leading-[1.5] font-normal text-ink">Please leave out details we don’t need, such as date of birth, photo, health, religion, ethnicity, Social Security or other ID numbers.</span>
            </label>
          ) : (
            <label className={label}><span>Company</span><input name="company" autoComplete="organization" className={field} /></label>
          )}
          <label className={label}>Preferred method of contact<select name="method" value={method} onChange={(e) => setMethod(e.target.value === "Phone" ? "Phone" : "Email")} className={field}><option>Email</option><option>Phone</option></select></label>
          <label className={`${label} col-span-full`}>
            {isCan ? "Your comments or questions" : "What are you hiring for?"}
            <textarea name="message" required rows={5} className="resize-y border border-field bg-white p-3 text-[16px] outline-teal" />
          </label>
          {isCan ? (
            <>
              {/* Notice, not consent: replying and considering the candidate need no tick (reports/Banister privacy and
                  terms findings.md, "The consent sentence"). The box confirms a fact the US-only design relies on. */}
              <div className="col-span-full flex flex-col gap-2 text-[13.5px] leading-[1.6]" id="candidate-notice">
                <p className="m-0"><strong className="text-navy">How we use your details.</strong> <Blank>{LEGAL.entity}</Blank> (“Banister International”) will use what you send, including your résumé, to reply to you and to consider you for suitable roles. We keep it in our recruitment database, provided by Ezekia, and software reads your résumé to build your profile. We’ll contact you about your inquiry using your preferred method.</p>
                <p className="m-0">About once a year we’ll email you to ask whether you’d like us to delete your details. If you don’t reply we keep them, and we delete them after <Blank>{LEGAL.cutoffYears}</Blank> years with no contact. You can ask us to correct or delete them at any time at <Blank>{LEGAL.privacyEmail}</Blank>; some records we may have to keep by law. <Link href="/privacy/#candidates" className={link}>Privacy Policy</Link></p>
              </div>
              <label className="col-span-full flex items-start gap-3 text-[13.5px] leading-[1.6]">
                <input type="checkbox" name="usCandidate" required aria-describedby="candidate-notice" className="mt-[3px] h-[18px] w-[18px] flex-none accent-navy" />
                <span>I confirm I live in the United States and this is a US candidate submission. Banister International accepts candidate submissions from the US only and handles them under US privacy and record-keeping law.</span>
              </label>
            </>
          ) : (
            // Notice, no checkbox: replying to an inquiry needs no consent, and the old box forced agreement to phone and
            // email contact (report items D2 and D4).
            <p className="col-span-full m-0 text-[13.5px] leading-[1.6]"><strong className="text-navy">How we use your details.</strong> <Blank>{LEGAL.entity}</Blank> (“Banister International”) will use what you send to reply to your inquiry and discuss your hiring needs. We keep it in our client database, provided by Ezekia, for {LEGAL.employerRetention}. You can ask us to correct or delete it at {LEGAL.privacyEmail}; some records we may have to keep by law. Please don’t include personal details about candidates or staff unless we need them. <Link href="/privacy/#clients" className={link}>Privacy Policy</Link></p>
          )}
          {err && (
            <p role="alert" className="col-span-full m-0 text-[14px] leading-[1.5] font-semibold" style={{ color: "#8a1c15" }}>{err}</p>
          )}
          <button type="submit" disabled={sending}
            className="relative col-span-full flex min-w-[150px] cursor-pointer items-center justify-center gap-3.5 justify-self-start overflow-hidden border-0 bg-navy px-[22px] py-[14px] text-[13px] font-bold tracking-[.06em] text-white hover:bg-navy-hover">
            {sending ? (
              <>
                <span key="t" style={{ animation: "bnIn .2s both" }}>SENDING</span>
                <span key="s" className="h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "bnSpin .6s linear infinite, bnIn .2s both" }} />
              </>
            ) : (
              <><span key="t">SUBMIT</span><span key="a"><Arrow /></span></>
            )}
          </button>
        </form>
      </div>
      )}
    </section>
  );
}
