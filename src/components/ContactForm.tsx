"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavyCta } from "./ui";

type Audience = "candidate" | "employer";

const field = "box-border h-12 border border-field bg-white p-3 text-[16px] outline-teal";
const label = "flex flex-col gap-2 text-[14px] font-semibold text-navy";

export default function ContactForm({ initialAudience }: { initialAudience: Audience }) {
  const [aud, setAud] = useState<Audience>(initialAudience);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [who, setWho] = useState({ name: "", email: "" });
  const [file, setFile] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const isCan = aud === "candidate";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setWho({ name: String(fd.get("first") || "").trim(), email: String(fd.get("email") || "").trim() });
    // [assumption] No submission backend yet — the design simulates a 1.2s send. Wire a server action here.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  const tab = (on: boolean) => ({ background: on ? "#edeff2" : "#fff", borderTopColor: on ? "#003f5e" : "transparent" });

  return (
    <section className="px-gutter mx-auto max-w-[920px] pt-[clamp(48px,6vw,72px)] pb-[clamp(64px,7vw,96px)]">
      <h1 className="m-0 mb-3 text-[clamp(32px,3.4vw,44px)] font-bold text-navy">Contact</h1>
      <p className="m-0 mb-9 min-h-[calc(1.65em*2)] max-w-[600px] text-[17px] leading-[1.65]">
        {isCan ? "Share your background and the kind of role you’re looking for. Every conversation is confidential." : "Tell us about the role or the change ahead, and a partner will respond personally."}
      </p>
      <div className="flex gap-1" role="tablist" aria-label="I am">
        {(["candidate", "employer"] as const).map((a) => (
          <button key={a} type="button" role="tab" aria-selected={aud === a} onClick={() => setAud(a)}
            className="m-0 cursor-pointer border-0 border-t-3 px-[22px] py-[14px] text-[13px] font-bold tracking-[.06em] text-navy" style={tab(aud === a)}>
            {a === "candidate" ? "FOR CANDIDATES" : "FOR EMPLOYERS"}
          </button>
        ))}
      </div>
      <div className="grid bg-fog p-[clamp(24px,4vw,44px)]">
        <div className="flex w-full max-w-[520px] flex-col items-center gap-[18px] self-center justify-self-center py-6 text-center [grid-area:1/1]"
          role="status" aria-hidden={!sent}
          style={{ visibility: sent ? "visible" : "hidden", opacity: sent ? 1 : 0, transform: sent ? "none" : "translateY(12px)", transition: "opacity .5s ease .15s, transform .6s cubic-bezier(.2,.8,.2,1) .15s" }}>
          {sent && (
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-navy text-[32px] font-extrabold text-gold"
              style={{ animation: "bnPop .55s cubic-bezier(.2,.9,.3,1.3) .3s both" }}>✓</span>
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
          <label className={label}>First name<input name="first" required autoComplete="given-name" className={field} /></label>
          <label className={label}>Last name<input name="last" required autoComplete="family-name" className={field} /></label>
          <label className={label}>Email address<input name="email" type="email" required autoComplete="email" className={field} /></label>
          <label className={label}>Phone<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
          {isCan ? (
            <label className={`${label} cursor-pointer`}>
              <span>Upload résumé <span className="text-[13px] font-normal text-slate">(PDF or Word, max 50 MB)</span></span>
              <span className="box-border flex h-12 items-stretch border border-field bg-white">
                <span className="flex flex-none items-center bg-navy px-[18px] text-[12.5px] font-bold tracking-[.06em] text-white hover:bg-navy-hover">CHOOSE FILE</span>
                <span className="flex min-w-0 flex-1 items-center overflow-hidden px-3.5 text-[14px] font-normal text-ellipsis whitespace-nowrap" style={{ color: file ? "#003f5e" : "#6a7276" }}>{file || "No file chosen"}</span>
              </span>
              <input type="file" name="resume" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0]?.name || null)}
                className="pointer-events-none absolute h-px w-px opacity-0" />
            </label>
          ) : (
            <label className={label}><span>Company</span><input name="company" autoComplete="organization" className={field} /></label>
          )}
          <label className={label}>Preferred method of contact<select name="method" className={field}><option>Email</option><option>Phone</option></select></label>
          <label className={`${label} col-span-full`}>
            {isCan ? "Your comments or questions" : "What are you hiring for?"}
            <textarea name="message" required rows={5} className="resize-y border border-field bg-white p-3 text-[16px] outline-teal" />
          </label>
          <label className="col-span-full flex items-start gap-3 text-[13.5px] leading-[1.6]">
            <input type="checkbox" name="consent" required className="mt-[3px] h-[18px] w-[18px] flex-none accent-navy" />
            <span>With your submission, you grant us permission to store your personal information and use it in consideration of your inquiry. You agree to receive communications from us by phone and email.</span>
          </label>
          <button type="submit" disabled={sending}
            className="relative col-span-full flex min-w-[150px] cursor-pointer items-center justify-center gap-3.5 justify-self-start overflow-hidden border-0 bg-navy px-[22px] py-[14px] text-[13px] font-bold tracking-[.06em] text-white hover:bg-navy-hover">
            {sending ? (
              <>
                <span key="t" style={{ animation: "bnIn .2s both" }}>SENDING</span>
                <span key="s" className="h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "bnSpin .6s linear infinite, bnIn .2s both" }} />
              </>
            ) : (
              <><span key="t">SUBMIT</span><span key="a">→</span></>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
