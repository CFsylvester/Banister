import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The social card shown when a page is shared (LinkedIn, Slack, X): the white logo on the site's navy, a headline,
// and the teal rule the page heroes use. Pattern from node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/01-metadata/opengraph-image.md ("Using Node.js runtime with local assets").
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export async function ogCard({ eyebrow, headline }: { eyebrow: string; headline: string }) {
  const logo = await readFile(join(process.cwd(), "public/assets/banister-logo-white.svg"), "base64");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: "linear-gradient(180deg,#003f5e 0%,#003f5e 70%,#0b5f7a 100%)", color: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> only */}
        <img src={`data:image/svg+xml;base64,${logo}`} height={64} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ width: 72, height: 6, background: "#2bc1c6" }} />
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: 2, color: "#ffc91e", textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>{headline}</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
