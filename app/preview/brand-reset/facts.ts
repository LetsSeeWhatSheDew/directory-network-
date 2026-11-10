// The details behind a deal, as plain rows, so each concept can style them its
// own way. Every value comes from the row or the deal log; missing data says so.
import type { PDeal, PreviewData } from "./data";

export type Fact = { k: string; v: string; href?: string; external?: boolean };

export function dealFacts(d: PDeal, hist?: PreviewData["history"]): Fact[] {
  const out: Fact[] = [{ k: "The store's own words", v: `“${d.title}”` }];
  if (d.conditionNote) out.push({ k: "Heads up", v: d.conditionNote });
  if (d.otd) out.push({ k: `Out the door in ${d.otd.city}`, v: `${d.otd.shelf} on the shelf ≈ ${d.otd.total} after tax (+${d.otd.ratePct}%)` });
  if (hist !== undefined) {
    out.push({
      k: "Track record",
      v: hist
        ? `A deal here ${hist.deal_days_30d} of the last 30 days. Usually ${hist.typical_discount_pct ?? "—"}% off; best seen ${hist.best_discount_pct ?? "—"}%.`
        : "Not enough history yet.",
    });
  }
  out.push({ k: "Hours", v: d.closesLabel });
  out.push({ k: "Where", v: d.address ? `${d.address}, ${d.city}` : d.city, href: d.directions, external: true });
  if (d.features.length) out.push({ k: "Ways to buy", v: d.features.join(" · ") });
  if (d.sourceUrl) {
    const name = d.store.replace(/\s+(East Peoria|Peoria Heights|Peoria|Pekin|Urbana|Champaign|Bloomington|Normal|Springfield)$/i, "");
    out.push({ k: "Seen on", v: `${name}${/s$/i.test(name) ? "'" : "'s"} site${d.checkedLabel ? `, ${d.checkedLabel}` : ""}`, href: d.sourceUrl, external: true });
  }
  if (d.phone) out.push({ k: "Call", v: d.phone, href: `tel:${d.phone.replace(/[^\d+]/g, "")}` });
  return out;
}

/** "Ogeez" from "Ogeez products" — for sentences. */
export function shortProduct(d: PDeal) {
  return d.product.replace(/\s+(products|brands)$/i, "");
}

/** Flyer QR target with the campaign tags UtmCapture already records. */
export function flyerUrl(concept: string) {
  const u = new URL("https://www.puffprice.com/");
  u.searchParams.set("utm_source", "flyer");
  u.searchParams.set("utm_medium", "qr");
  u.searchParams.set("utm_campaign", `nov26-${concept}`);
  return u.toString();
}
