"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Phase = "idle" | "sending" | "sent";

export default function SubscribeBand() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) { setErr("Please enter your email address."); setPhase("idle"); return; }
    if (!EMAIL.test(v)) { setErr("Please enter a valid email address, e.g. name@company.com."); setPhase("idle"); return; }
    if (phase === "sending") return;
    setErr(null); setPhase("sending");
    // [assumption] No subscription backend yet — the design simulates a 900ms round-trip. Wire a real
    // endpoint (server action / route handler) here before launch.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase("sent"), 900);
  };

  const msg = err || (phase === "sent" ? "Thanks — you’re on the list." : "");

  return (
    <section className="bg-gold">
      <form noValidate onSubmit={submit}
        className="site px-gutter flex flex-wrap items-center justify-between gap-x-10 gap-y-4 pt-7 pb-[14px]">
        <span className="pb-[22px] text-[18px] font-bold text-navy">Sign up for quarterly articles and perspectives</span>
        <div className="flex max-w-[480px] flex-[1_1_320px] flex-col gap-1.5">
          <div className="flex border-b-2" style={{ borderBottomColor: err ? "#b3261e" : "#003f5e" }}>
            <input type="email" value={email} placeholder="EMAIL ADDRESS" aria-label="Email address"
              aria-invalid={err ? "true" : "false"} aria-describedby="sub-msg"
              onChange={(e) => { const v = e.target.value; setEmail(v); setErr(err && !EMAIL.test(v.trim()) ? err : null); setPhase("idle"); }}
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-[15px] font-semibold tracking-[.04em] text-navy outline-none" />
            <button type="submit" aria-label="Subscribe"
              className="relative flex w-11 cursor-pointer items-center justify-center overflow-hidden border-0 bg-navy text-[18px] text-white">
              {phase === "sending" ? (
                <span key="sp" className="flex items-center justify-center">
                  <span className="absolute" style={{ animation: "bnFly .28s ease-in forwards" }}>→</span>
                  <span className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "bnSpin .6s linear infinite, bnIn .2s .2s both" }} />
                </span>
              ) : phase === "sent" ? (
                <span key="ok" className="absolute inset-0 flex items-center justify-center" style={{ animation: "bnFlash .6s ease-out" }}>
                  <span className="inline-block font-extrabold text-gold" style={{ animation: "bnPop .45s cubic-bezier(.2,.9,.3,1.3) both" }}>✓</span>
                </span>
              ) : <span key="ar">→</span>}
            </button>
          </div>
          <span id="sub-msg" role="status" className="min-h-4 text-[13px] leading-4 font-semibold" style={{ color: err ? "#8a1c15" : "#003f5e" }}>
            {msg ? <span key={msg} className="inline-block" style={{ animation: "bnFade .35s ease-out both" }}>{msg}</span> : null}
          </span>
        </div>
      </form>
    </section>
  );
}
