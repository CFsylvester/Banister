import { isBlank } from "@/lib/legal";

/** A legal fact from src/lib/legal.ts; still-unfilled blanks are highlighted so they're impossible to miss. */
export default function Blank({ children }: { children: string }) {
  return isBlank(children) ? <mark className="bg-gold/40 px-0.5 text-inherit">{children}</mark> : <>{children}</>;
}
