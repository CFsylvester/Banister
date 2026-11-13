import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The social card shown when any page is shared (LinkedIn, Slack, X). Pattern from node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/01-metadata/opengraph-image.md ("Using Node.js runtime with local assets").
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const NAVY = "#003f5e"; // --color-navy in src/app/globals.css
// public/assets/banister-logo-white.svg has viewBox 0 0 529.92 121.73; this keeps its aspect ratio.
const LOGO_RATIO = 121.73 / 529.92;
const readLogo = () => readFile(join(process.cwd(), "public/assets/banister-logo-white.svg"), "base64");

/** The share card for every page: only the white logo, centered on solid navy [Design Choice, owner 2026-11-13]. */
export async function ogLogoCard() {
  const logo = await readLogo();
  const width = 680;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: NAVY }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> only */}
        <img src={`data:image/svg+xml;base64,${logo}`} width={width} height={Math.round(width * LOGO_RATIO)} alt="" />
      </div>
    ),
    ogSize,
  );
}
