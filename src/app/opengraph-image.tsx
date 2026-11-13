import { ogContentType, ogLogoCard, ogSize } from "@/lib/og/card";

export const alt = "Banister International";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogLogoCard();
}
