import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const alt = "Banister International — executive search since 1999";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  // Both lines are visible site copy: the home H1 ("We Build Companies") and the home lede (founded 1999, executive search).
  return ogCard({ eyebrow: "Executive search since 1999", headline: "We Build Companies" });
}
