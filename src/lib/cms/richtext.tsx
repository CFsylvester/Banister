import Link from "next/link";
import type { ReactNode } from "react";
import { documentToReactComponents, type Options } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS, type Document } from "@contentful/rich-text-types";
import { mapButton } from "./map/hero.ts";
import type { ButtonFields, CmsEntry, RichTextDocument, RichTextNode } from "./types.ts";

// Gold call-to-action — the design's hero button (classes unchanged from the pre-CMS page).
const GOLD =
  "flex-none cursor-pointer items-center gap-[18px] bg-gold px-6 py-4 text-[13px] font-extrabold tracking-[.06em] text-navy no-underline hover:bg-white hover:text-navy";

export function CmsButton({ entry, inline = false }: { entry: CmsEntry<ButtonFields>; inline?: boolean }) {
  const b = mapButton(entry);
  const cls = `${inline ? "inline-flex align-middle" : "flex"} ${GOLD}`;
  const inner = <>{b.label} <span>→</span></>;
  return b.external
    ? <a href={b.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link href={b.href} className={cls}>{inner}</Link>;
}

const H1 = "m-0 text-[clamp(44px,6.4vw,92px)] leading-[1.05] font-bold tracking-[-.01em] text-white";

// Inline content of a title paragraph: bold → teal, inline-embedded buttons → gold button in the line.
const inlineOpts: Options = {
  renderMark: { [MARKS.BOLD]: (text) => <span className="text-teal">{text}</span> },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_n, children) => <>{children}</>,
    [INLINES.EMBEDDED_ENTRY]: (n) => <CmsButton entry={n.data.target as CmsEntry<ButtonFields>} inline />,
  },
};
const inline = (nodes: RichTextNode[]) =>
  documentToReactComponents({ nodeType: "document", data: {}, content: nodes } as unknown as Document, inlineOpts);

/**
 * Hero title rich text (migration 0002: bold + embedded buttons only). Consecutive paragraphs render as one
 * <h1> (joined by line breaks); a block-embedded button renders as the gold button beside/below it — with the
 * seed ("We **Build** Companies" + one block button) this is exactly the design's markup.
 */
export function HeroTitle({ doc }: { doc: RichTextDocument }) {
  const out: ReactNode[] = [];
  let run: RichTextNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const parts = run.flatMap((p, i) => (i ? [<br key={`br${i}`} />] : []).concat(<span key={`p${i}`}>{inline([p])}</span>));
    out.push(<h1 key={`h${out.length}`} className={H1}>{run.length === 1 ? inline(run) : parts}</h1>);
    run = [];
  };
  // The Contentful editor leaves an empty paragraph after an embedded block — skip text-less paragraphs.
  const isEmpty = (p: RichTextNode) => (p.content ?? []).every((c) => c.nodeType === "text" && !c.value?.trim());
  for (const n of doc.content) {
    if (n.nodeType === BLOCKS.PARAGRAPH) { if (!isEmpty(n)) run.push(n); }
    else if (n.nodeType === BLOCKS.EMBEDDED_ENTRY) { flush(); out.push(<CmsButton key={`b${out.length}`} entry={n.data.target as CmsEntry<ButtonFields>} />); }
  }
  flush();
  // Only paragraphs + embedded buttons are allowed by the model; "title has text" is enforced in mapHero.
  return <>{out}</>;
}
