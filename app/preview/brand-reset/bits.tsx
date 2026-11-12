// Small shared pieces for the round-2 concepts.
import type { PDeal } from "./data";
import StoreMarkClient from "./StoreMark";

/** The store's real logo, or its initials. */
export function StoreMark({ d, className, monoClassName }: { d: PDeal; className: string; monoClassName: string }) {
  return <StoreMarkClient src={d.logo} name={d.store} className={className} monoClassName={monoClassName} />;
}

/** "40" + "%" split so the unit can be set smaller. */
export function splitAmount(big: string | null): { n: string; unit: string } | null {
  if (!big) return null;
  if (big.endsWith("%")) return { n: big.slice(0, -1), unit: "%" };
  if (big.startsWith("$")) return { n: big.slice(1), unit: "$" };
  return { n: big, unit: "" };
}

export function nowCT() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}
