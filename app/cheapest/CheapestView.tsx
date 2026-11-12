// Shared body for /cheapest and /cheapest/[city]: the lowest out-the-door
// price per store for an eighth, a 1g cart and 100mg of gummies, read from
// each store's own online menu (lib/menuPrices.ts). One rung of the ladder
// only — same size, any brand — and the page says so up top.
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { CENTRAL_IL_CITIES } from "../../lib/constants/regions";
import {
  REF_UNITS,
  REF_DEF,
  RUNG_LABEL,
  NEAR_MILES,
  money,
  checkedLabel,
  type CheapestBoard,
  type CheapestItem,
  type RefUnit,
} from "../../lib/menuPrices";
import { QuickAnswer, FaqBlock, GUIDE_EXTRA_CSS, type Faq } from "../guides/GuideParts";

const CSS = `
.cp-best{display:grid;grid-template-columns:1fr;gap:10px;margin:6px 0 4px}
@media(min-width:700px){.cp-best{grid-template-columns:repeat(3,1fr)}}
.cp-best-card{display:grid;gap:2px;padding:16px 18px;border-radius:18px;background:#10291C;color:#F4EAD5;text-decoration:none}
.cp-best-card:hover{background:#173A28}
.cp-best-l{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#D9AC4F}
.cp-best-card b{font-family:var(--font-gold-display),Georgia,serif;font-size:2.6rem;line-height:1;color:#F6DC8F;margin:4px 0}
.cp-best-s{font-weight:700}
.cp-best-p{font-size:.85rem;color:rgba(244,234,213,.8);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.cp-rung{display:inline-flex;align-items:center;gap:8px;margin:14px 0 2px;padding:6px 12px;border-radius:999px;background:var(--pp-paper);border:1px solid var(--pp-border);font-size:.8rem;font-weight:600;color:var(--pp-ink)}
.cp-rung span{font-family:var(--font-mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--pp-muted);font-weight:500}
.cp-sec{margin-top:30px}
.cp-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:13px 14px;border-top:1px solid var(--pp-border)}
.cp-row:first-child{border-top:none}
.cp-n{font-family:var(--font-mono);font-size:.8rem;color:var(--pp-muted);padding-top:2px}
.cp-store{font-weight:600;color:inherit;text-decoration:none}
.cp-store:hover{text-decoration:underline}
.cp-prod{font-size:.9rem;color:var(--pp-body);overflow-wrap:anywhere}
.cp-meta{font-size:.78rem;color:var(--pp-muted);overflow-wrap:anywhere}
.cp-meta a{color:var(--pp-muted)}
.cp-r{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.cp-r b{font-family:var(--font-mono);font-weight:500;font-size:1.15rem;letter-spacing:-.02em}
.cp-r span{font-size:.76rem;color:var(--pp-muted);white-space:nowrap}
.cp-sale{display:inline-block;margin-top:2px;font-size:.7rem;font-weight:700;padding:2px 7px;border-radius:999px;background:var(--pp-note-bg);color:var(--pp-note-fg)}
.cp-empty{margin-top:22px;padding:18px;border-radius:14px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
.cp-empty b{font-family:var(--font-display);font-size:1.1rem;font-weight:400}
.cp-cities{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.cp-cities a{font-size:.85rem;padding:6px 11px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:inherit;text-decoration:none}
.cp-cities a[aria-current=page]{border-color:var(--pp-canopy);font-weight:600}
@media (max-width:520px){.cp-row{grid-template-columns:22px minmax(0,1fr) auto;padding:12px 10px}.cp-r b{font-size:1.02rem}}
`;

/** Menus often list products in ALL CAPS ("HUSTLER'S AMBITION BLUE SHERBET").
 *  Shouting words become Title Case; short codes (THC, CBD, 1G, AIO) stay. */
function calm(s: string): string {
  return s.replace(/\b[A-Z][A-Z'’]{3,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
}

function itemLine(it: CheapestItem): string {
  const name = calm(it.product.replace(/\s+/g, " ").trim());
  // Many menus already start the product name with the brand.
  const brand = it.brand && !name.toLowerCase().startsWith(it.brand.toLowerCase()) ? `${calm(it.brand)} ` : "";
  return `${brand}${name}`;
}

/** "an eighth for $25.41 out the door at NOXX East Peoria (East Peoria)" */
function sentenceFor(ref: RefUnit, it: CheapestItem): string {
  const what = ref === "eighth" ? "eighth" : ref === "cart_1g" ? "1g cart" : "100mg of gummies";
  return `the cheapest ${what} is ${money(it.otd)} out the door (${money(it.pretax)} on the shelf) at ${it.storeName} in ${it.city}, ${itemLine(it)}`;
}

export function quickAnswerText(board: CheapestBoard, where: string): string | null {
  const parts = REF_UNITS.map((r) => (board.byRef[r][0] ? sentenceFor(r, board.byRef[r][0]) : null)).filter(Boolean) as string[];
  if (!parts.length) return null;
  return `On the store menus we read ${where} today, ${parts.join("; ")}. Prices include Illinois and local cannabis tax and come from each store's own online menu (${board.stores} store${board.stores === 1 ? "" : "s"}), same size, any brand.`;
}

export function faqsFor(board: CheapestBoard, where: string): Faq[] {
  const e = board.byRef.eighth[0];
  const c = board.byRef.cart_1g[0];
  const g = board.byRef.gummies_100mg[0];
  const out: Faq[] = [];
  out.push({
    q: `How much is an eighth ${where} today?`,
    a: e
      ? `The lowest we found is ${money(e.otd)} out the door (${money(e.pretax)} shelf price) for ${itemLine(e)} at ${e.storeName} in ${e.city}, checked ${checkedLabel(e.checkedAt)} Central on the store's own menu. Across the ${board.byRef.eighth.length} store${board.byRef.eighth.length === 1 ? "" : "s"} we read, each store's cheapest eighth runs ${money(board.byRef.eighth[0].otd)} to ${money(board.byRef.eighth[board.byRef.eighth.length - 1].otd)} with tax.`
      : "We don't have a fresh menu price for an eighth here right now. Our menu reader checks each store's own online menu twice a day.",
  });
  out.push({
    q: `What does a 1g vape cart cost ${where}?`,
    a: c
      ? `The cheapest 1g cartridge on the menus we read is ${money(c.otd)} out the door (${money(c.pretax)} before tax), ${itemLine(c)} at ${c.storeName}. Carts are taxed at Illinois's 25% cannabis rate, so tax adds more than it does on flower. Disposables are not included.`
      : "No fresh menu price for a 1g cartridge here right now.",
  });
  out.push({
    q: `How much are 100mg gummies ${where}?`,
    a: g
      ? `From ${money(g.otd)} out the door (${money(g.pretax)} shelf) for ${itemLine(g)} at ${g.storeName}. Only packs with 100mg of THC in total count; CBD and CBN blends are left out.`
      : "No fresh menu price for 100mg gummies here right now.",
  });
  out.push({
    q: "Is this an average price?",
    a: `No. It's the lowest price each store lists today for one exact size in one category, from the store's own menu, then ranked. We never blend products or stores into an index. A store not listed here isn't necessarily more expensive; we may not be able to read its menu yet.`,
  });
  return out;
}

export default function CheapestView({
  board,
  title,
  where,
  cityLabel,
  currentCity,
  jsonLd,
  eyebrow,
}: {
  board: CheapestBoard;
  title: string;
  where: string; // "in Central Illinois" / "near Peoria"
  cityLabel: string | null;
  currentCity: string | null;
  jsonLd: object[];
  eyebrow: string;
}) {
  const quick = quickAnswerText(board, where);
  const hasData = REF_UNITS.some((r) => board.byRef[r].length > 0);
  const faqs = faqsFor(board, where);
  return (
    <GuideShell
      crumbs={[{ href: "/guides", label: "Guides" }, ...(currentCity ? [{ href: "/cheapest", label: "Cheapest today" }] : [])]}
      eyebrow={eyebrow}
      title={title}
      lede={
        <>
          The lowest price each store lists today for an eighth of flower, a 1g vape cart and 100mg of gummies, read from the
          store&apos;s own online menu, with Illinois and local tax added.{cityLabel ? ` Stores within ${NEAR_MILES} miles of ${cityLabel}.` : ""} For adults 21 and over.
        </>
      }
      jsonLd={jsonLd}
    >
      <style>{GUIDE_EXTRA_CSS + CSS}</style>
      <div className="cp-rung">
        <span>Comparison</span>
        {RUNG_LABEL}
      </div>

      {hasData && (
        <div className="cp-best" aria-label="Lowest prices today">
          {REF_UNITS.map((ref) => {
            const it = board.byRef[ref][0];
            if (!it) return null;
            return (
              <Link key={ref} href={`/dispensary/${it.listingSlug}`} className="cp-best-card">
                <span className="cp-best-l">{REF_DEF[ref].label}</span>
                <b>{money(it.otd)}</b>
                <span className="cp-best-s">{it.storeName}</span>
                <span className="cp-best-p">{itemLine(it)}</span>
              </Link>
            );
          })}
        </div>
      )}

      {quick && board.newest && (
        <details className="g-rest" style={{ margin: "14px 0 8px" }}>
          <summary>The short answer, in words</summary>
          <QuickAnswer updated={`${checkedLabel(board.newest)} Central`}>{quick}</QuickAnswer>
        </details>
      )}

      {!hasData ? (
        <div className="cp-empty">
          <b>No menu prices {where} yet.</b>
          <p className="gp-p" style={{ marginTop: 8 }}>
            Our menu reader opens each store&apos;s own online menu twice a day, around 6 AM and noon Central, and writes down the shelf
            price of every eighth, 1g cart and 100mg gummy pack it finds. Prices show up here after its next run. We only show a
            price we read today; we never fill the gap with an estimate.
          </p>
          <p className="gp-p">
            In the meantime, <Link href="/out-the-door">today&apos;s deals with tax added</Link> and the <Link href="/illinois-cannabis-tax-calculator">tax calculator</Link> cover the same question from the deals side.
          </p>
        </div>
      ) : (
        REF_UNITS.map((ref) => {
          const rows = board.byRef[ref];
          const def = REF_DEF[ref];
          return (
            <section key={ref} className="cp-sec" aria-labelledby={`cp-${ref}`}>
              <h2 className="gp-h2" id={`cp-${ref}`} style={{ marginTop: 0 }}>
                {def.label} <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", color: "var(--pp-muted)" }}>{def.size}</span>
              </h2>
              {rows.length === 0 ? (
                <p className="gp-note">No store we read {where} lists one today.</p>
              ) : (
                <div className="gp-list">
                  {rows.slice(0, 3).map((it, i) => (
                    <div key={it.listingSlug} className="cp-row">
                      <span className="cp-n">{i + 1}</span>
                      <span style={{ minWidth: 0 }}>
                        <Link href={`/dispensary/${it.listingSlug}`} className="cp-store">{it.storeName}</Link>
                        <span className="cp-meta"> · {it.city}{it.milesFrom != null && it.milesFrom >= 1 ? ` · ${Math.round(it.milesFrom)} mi` : ""}</span>
                        <br />
                        <span className="cp-prod">{itemLine(it)}</span>
                        <br />
                        {it.sourceUrl && (
                          <a className="cp-meta" href={it.sourceUrl} rel="nofollow noopener" target="_blank" title={`Checked ${checkedLabel(it.checkedAt)}`}>
                            menu ↗
                          </a>
                        )}
                      </span>
                      <span className="cp-r">
                        <b>{money(it.otd)}</b>
                        <span>{money(it.pretax)} + tax</span>
                        {it.onSale && <span className="cp-sale">regular {money(it.regular)}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {rows.length > 3 && (
                <details className="g-rest">
                  <summary>{rows.length - 3} more stores</summary>
                  <div className="gp-list">
                    {rows.slice(3).map((it, j) => (
                      <div key={it.listingSlug} className="cp-row">
                        <span className="cp-n">{j + 4}</span>
                        <span style={{ minWidth: 0 }}>
                          <Link href={`/dispensary/${it.listingSlug}`} className="cp-store">{it.storeName}</Link>
                          <span className="cp-meta"> · {it.city}</span>
                          <br />
                          <span className="cp-prod">{itemLine(it)}</span>
                        </span>
                        <span className="cp-r">
                          <b>{money(it.otd)}</b>
                          <span>{money(it.pretax)} + tax</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <p className="gp-note">Out-the-door price in the store&apos;s city, {def.taxNote}.</p>
            </section>
          );
        })
      )}

      <h2 className="gp-h2">How this list works</h2>
      <p className="gp-p">
        Each store&apos;s row is the cheapest product it lists at exactly that size: {REF_UNITS.map((r) => REF_DEF[r].size).join(", ")}. Brands differ from
        row to row, so this answers &ldquo;where is the cheapest eighth right now,&rdquo; not &ldquo;where is this exact product cheapest.&rdquo; A sale
        price counts only when the menu shows it as a plain price anyone pays; bundle, buy-several and first-time offers don&apos;t count. Any price
        outside a sane range for its size is thrown out rather than shown.
      </p>
      <p className="gp-p">
        We can read {board.stores > 0 ? `${board.stores} store menu${board.stores === 1 ? "" : "s"} ${where} right now` : "only some store menus so far"}. Some stores load
        their menus in ways we can&apos;t read yet, so a store missing here isn&apos;t necessarily more expensive. Taxes come from our{" "}
        <Link href="/illinois-cannabis-tax">Illinois cannabis tax</Link> table; percent-off deals are on <Link href="/out-the-door">out the door</Link>.
        Want to hear when one of these drops? <Link href="/price-watch">Watch a price</Link>.
      </p>

      <h2 className="gp-h2">By city</h2>
      <div className="cp-cities">
        <Link href="/cheapest" aria-current={currentCity ? undefined : "page"}>All Central IL</Link>
        {CENTRAL_IL_CITIES.map((c) => (
          <Link key={c.slug} href={`/cheapest/${c.slug}`} aria-current={currentCity === c.slug ? "page" : undefined}>{c.name}</Link>
        ))}
      </div>

      <FaqBlock faqs={faqs} />
      <p className="gp-note">
        Menu prices change during the day and can differ in store. Confirm at the counter. Found a wrong price? Email {brand.supportEmail}. 21+.
      </p>
    </GuideShell>
  );
}
