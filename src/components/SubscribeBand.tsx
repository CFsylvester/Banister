"use client";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { useRef, useState, type FormEvent } from "react";
import { subscribe } from "@/app/actions/subscribe";
import { EMAIL_HELP, HONEYPOT_FIELD, validEmail } from "@/lib/signup";
import { Arrow } from "./ui";

type Phase = "idle" | "sending" | "sent";

export default function SubscribeBand() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  // Ref, not state: blocks a second submit in the same tick, before React re-renders with phase "sending".
  const inFlight = useRef(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlight.current) return;
    if (!email.trim()) { setErr("Please enter your email address."); setPhase("idle"); return; }
    if (!validEmail(email)) { setErr(EMAIL_HELP); setPhase("idle"); return; }
    inFlight.current = true;
    setErr(null); setPhase("sending");
    // Adds the email to the Ezekia sign-up list (src/app/actions/subscribe.ts).
    const res = await subscribe(new FormData(e.currentTarget)).catch(() => ({ ok: false as const, error: "Sorry, we couldn’t sign you up just now. Please try again later." }));
    inFlight.current = false;
    if (res.ok) setPhase("sent");
    else { setErr(res.error); setPhase("idle"); }
  };

  const msg = err || (phase === "sent" ? "Thanks — you’re on the list." : "");

  return (
    <section className="bg-gold">
      <form noValidate onSubmit={submit}
        className="site px-gutter flex flex-wrap items-center justify-between gap-x-10 gap-y-4 pt-7 pb-[14px]">
        <span className="pb-[22px] text-[18px] font-bold text-navy">Sign up for quarterly articles and perspectives</span>
        <div className="flex max-w-[480px] flex-[1_1_320px] flex-col gap-1.5">
          <div className="flex border-b-2" style={{ borderBottomColor: err ? "#b3261e" : "#003f5e" }}>
            {/* Honeypot for bots: hidden from people and assistive tech; the server action ignores filled-in sign-ups. */}
            <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <input type="email" name="email" value={email} readOnly={phase === "sending"} placeholder="EMAIL ADDRESS" aria-label="Email address"
              aria-invalid={err ? "true" : "false"} aria-describedby="sub-msg sub-notice"
              onChange={(e) => { const v = e.target.value; setEmail(v); setErr(err && !validEmail(v) ? err : null); setPhase((p) => (p === "sending" ? p : "idle")); }}
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-[15px] font-semibold tracking-[.04em] text-navy outline-none" />
            <button type="submit" aria-label="Subscribe"
              className="relative flex w-11 cursor-pointer items-center justify-center overflow-hidden border-0 bg-navy text-[18px] text-white">
              {phase === "sending" ? (
                <span key="sp" className="flex items-center justify-center">
                  <span className="absolute" style={{ animation: "bnFly .28s ease-in forwards" }}><Arrow /></span>
                  <span className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "bnSpin .6s linear infinite, bnIn .2s .2s both" }} />
                </span>
              ) : phase === "sent" ? (
                <span key="ok" className="absolute inset-0 flex items-center justify-center" style={{ animation: "bnFlash .6s ease-out" }}>
                  <span className="inline-block font-extrabold text-gold" style={{ animation: "bnPop .45s cubic-bezier(.2,.9,.3,1.3) both" }}>✓</span>
                </span>
              ) : <span key="ar"><Arrow /></span>}
            </button>
          </div>
          <span id="sub-msg" role="status" className="min-h-4 text-[13px] leading-4 font-semibold" style={{ color: err ? "#8a1c15" : "#003f5e" }}>
            {msg ? <span key={msg} className="inline-block" style={{ animation: "bnFade .35s ease-out both" }}>{msg}</span> : null}
          </span>
          {/* Notice at the point of sign-up, no checkbox (report item D8). Unsubscribe is by email until a sending tool is chosen. */}
          <p id="sub-notice" className="m-0 text-[12.5px] leading-[1.5] text-navy">
            We keep your address in our contact database, provided by Ezekia. Unsubscribe at any time by emailing{" "}
            <a href={`mailto:${LEGAL.privacyEmail}`} className="font-semibold text-navy underline">{LEGAL.privacyEmail}</a>.{" "}
            <Link href="/privacy/#newsletter" className="font-semibold text-navy underline">Privacy Policy</Link>
          </p>
        </div>
      </form>
    </section>
  );
}
