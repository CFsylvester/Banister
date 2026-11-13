import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const alt = "White paper: The state of talent acquisition in professional services";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard({ eyebrow: "White paper", headline: "The state of talent acquisition in professional services" });
}
