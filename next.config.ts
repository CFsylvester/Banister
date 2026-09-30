import type { NextConfig } from "next";

// GitHub Pages serves this repo at https://cfsylvester.github.io/Banister/, so production builds are a static
// export under a sub-path. The deploy workflow passes the path from actions/configure-pages' `base_path` output
// (https://github.com/actions/configure-pages/blob/v6.0.0/action.yml). Unset → "" for local `next dev`.
// Static export + basePath: node_modules/next/dist/docs/01-app/02-guides/static-exports.md and
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/basePath.md.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Emit /about/index.html (not about.html) so Pages serves /Banister/about/ without a server rewrite.
  trailingSlash: true,
  // next/link applies basePath itself; plain <img src="/assets/…"> does not, so expose it to src/lib/asset.ts.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
