// Kept out of content.ts so client components (Stats) can import them without pulling in the site copy.
// Shared responsive grid tracks from the design (4-up → 2-up below 760px, 3-up → 1-up below 640px).
export const GRID_4 = (gap: number) =>
  `repeat(auto-fit,minmax(min(calc((100% - ${gap}px)/2),max(calc((100% - ${gap * 3}px)/4),calc((760px - 100%)*999))),1fr))`;
export const GRID_3 = "repeat(auto-fit,minmax(min(100%,max(calc((100% - 64px)/3),calc((640px - 100%)*999))),1fr))";
