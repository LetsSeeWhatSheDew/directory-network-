// One quiet line under a deal: what it really costs at the register.
// Renders nothing unless the deal states a real price and we know the
// product type and the store's city (lib/otd.ts). No guesses.
import { otdFor, usd } from "../../lib/otd";

type DealLike = { deal_title?: string | null; title?: string | null; category?: string | null; city?: string | null };

export default function OtdLine({ deal, city, className = "" }: { deal: DealLike; city?: string | null; className?: string }) {
  const o = otdFor(deal, city);
  if (!o) return null;
  return (
    <span className={`pp-otd ${className}`} title={`${usd(o.shelf)} on the shelf + ${usd(o.tax)} Illinois and ${o.city} tax`}>
      About <b>{usd(o.total)}</b> out the door{o.each ? <> · {usd(o.each)} each</> : null}
    </span>
  );
}
