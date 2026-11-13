"use client";
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ContactForm, { type Audience } from "./ContactForm";

const toAudience = (q: string | null): Audience => (q === "employer" ? "employer" : "candidate");

/** Renders nothing: reports ?aud= to ContactFromQuery. It is the only thing inside <Suspense> because useSearchParams
 * client-renders the tree up to the closest boundary on a prerendered route (01-app/.../use-search-params.md,
 * "Prerendering"). A layout effect, so a client navigation to ?aud=employer switches the tab before the browser paints. */
function AudienceFromQuery({ onChange }: { onChange: (aud: Audience) => void }) {
  const q = useSearchParams().get("aud");
  useLayoutEffect(() => { onChange(toAudience(q)); }, [q, onChange]);
  return null;
}

/** Holds the audience shown on /contact. The form sits outside <Suspense>, so the prerendered form is the one that
 * hydrates: as the Suspense fallback, the client swapped in a new copy of it and the browser counted that as a second,
 * later LCP (mobile production lab, 2026-11-13: 972 ms then 1708 ms). The first ?aud= report only switches the tab, in
 * place. After that, a link that changes ?aud= to an audience other than the one on screen switches the tab and resets
 * the form (the remount main did on every ?aud= change); one to the audience already on screen leaves the form as it is.
 * A link to the URL already open changes nothing, as on main: ?aud= doesn't change, so no report is made. */
export default function ContactFromQuery({ candidateOpen }: { candidateOpen: boolean }) {
  const [state, setState] = useState<{ aud: Audience; resets: number }>({ aud: "candidate", resets: 0 });
  const reported = useRef(false);
  const fromQuery = useCallback((aud: Audience) => {
    const first = !reported.current;
    reported.current = true;
    setState((s) => (s.aud === aud ? s : { aud, resets: first ? s.resets : s.resets + 1 }));
  }, []);
  const fromTabs = useCallback((aud: Audience) => setState((s) => ({ ...s, aud })), []);
  return (
    <>
      <ContactForm key={state.resets} aud={state.aud} onAudChange={fromTabs} candidateOpen={candidateOpen} />
      <Suspense fallback={null}>
        <AudienceFromQuery onChange={fromQuery} />
      </Suspense>
    </>
  );
}
