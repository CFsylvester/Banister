import Reveal from "@/components/Reveal";
import { Icon } from "@/components/ui";

// Industries icon: rises into place the first time it scrolls into view, and plays its `hover` motion while the
// parent card is hovered (globals.css .reveal-icon).
export type HoverMotion =
  | "fly" | "drive" | "spin" | "roll" | "hop" | "pulse" | "lift" | "nod" | "flip" | "wiggle" | "sway" | "dash" | "glow";

export default function RevealIcon({ src, delayMs = 0, hover, className }: {
  src: string; delayMs?: number; hover?: HoverMotion; className?: string;
}) {
  return (
    <Reveal className={className ? `reveal-icon ${className}` : "reveal-icon"} delayMs={delayMs} data-hover={hover}>
      <Icon src={src} className="object-contain" />
    </Reveal>
  );
}
