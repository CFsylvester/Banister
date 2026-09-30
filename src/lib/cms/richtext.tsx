import { documentToReactComponents, type Options } from "@contentful/rich-text-react-renderer";
import { BLOCKS, MARKS, type Document } from "@contentful/rich-text-types";
import type { RichTextDocument } from "./types.ts";

// Headline rich text (migration 0001: paragraphs + bold only). Bold = the design's teal emphasis
// ("We **Build** Companies"); paragraphs render inline so the text sits directly in the <h1>.
const headline: Options = {
  renderMark: { [MARKS.BOLD]: (text) => <span className="text-teal">{text}</span> },
  renderNode: { [BLOCKS.PARAGRAPH]: (_node, children) => <>{children}</> },
};

export function Headline({ doc }: { doc: RichTextDocument }) {
  return <>{documentToReactComponents(doc as unknown as Document, headline)}</>;
}
