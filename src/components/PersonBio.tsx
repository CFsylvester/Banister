"use client";
import { useId, useState } from "react";
import type { people } from "@/lib/content";
import { Img } from "./ui";

/** Leadership row: lead paragraph always visible; the rest expands via a 0fr→1fr grid-row transition. */
export default function PersonBio({ person: p }: { person: (typeof people)[number] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const [lead, ...rest] = p.paras;
  return (
    <div className="grid grid-cols-[minmax(120px,220px)_minmax(0,1fr)] gap-x-[clamp(24px,4vw,56px)] gap-y-6 border-b border-rule py-10">
      <div className="self-start overflow-hidden bg-fog">
        <Img src={p.img} alt={p.name} className="block aspect-[4/5] w-full object-cover object-[50%_20%]"
          style={{ transform: "none", transition: "transform .8s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <div className="flex max-w-[760px] flex-col gap-3.5">
        <div className="text-[21px] leading-[1.3]"><strong className="text-navy">{p.name}</strong><span className="text-teal-deep">, {p.role}</span></div>
        <p className="m-0 text-[15.5px] leading-[1.75]">{lead}</p>
        <div id={id} className="grid" aria-hidden={!open} inert={!open}
          style={{ gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .5s cubic-bezier(.2,.8,.2,1)" }}>
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-3.5" style={{
              opacity: open ? 1 : 0, transform: open ? "none" : "translateY(-8px)",
              transition: `opacity .4s ease ${open ? ".12s" : "0s"}, transform .5s cubic-bezier(.2,.8,.2,1) ${open ? ".12s" : "0s"}`,
            }}>
              {rest.map((para) => <p key={para} className="m-0 text-[15.5px] leading-[1.75]">{para}</p>)}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id}
          className="m-0 flex cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 text-left text-[12.5px] font-bold tracking-[.06em] text-navy hover:text-navy-hover">
          <span className="underline decoration-navy decoration-1 underline-offset-[6px]">{open ? "SHOW LESS" : "READ FULL BIO"}</span>
          <span className="inline-block text-[14px] leading-none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .4s cubic-bezier(.2,.8,.2,1)" }}>↓</span>
        </button>
      </div>
    </div>
  );
}
