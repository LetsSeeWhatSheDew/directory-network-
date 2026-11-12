import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryArt, Grain, Leaf } from "./Art";
import {
  amountOf,
  productOf,
  storeName,
  storeHref,
  directionsHref,
  milesTo,
  milesLabel,
  cleanDealTitle,
  type Origin,
} from "../../../lib/exhale";
import { effectiveCategory } from "../../../lib/inferCategory";
import { ctTime, ctDay } from "../../../lib/home/goldData";

// Shared Gold Leaf building blocks: every page composes these, so a deal
// looks the same on the home page, a town page and a store page.

export type KitDeal = {
  deal_id?: string;
  id?: string;
  deal_title?: string | null;
  title?: string | null;
  deal_description?: string | null;
  description?: string | null;
  category?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  listing_slug?: string | null;
  slug?: string | null;
  verified_at?: string | null;
  name?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  drive_thru?: boolean | null;
};

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m7.5 12.5 3 3 6-6.5" />
    </svg>
  );
}

/** Picture for a deal: the inferred category, with vape words winning
 *  ("live resin all-in-one" is a vape, not a concentrate). */
export function artCategory(d: KitDeal): string | null {
  const t = `${d.deal_title || d.title || ""} ${d.deal_description || d.description || ""}`;
  if (/\b(vapes?|all[- ]in[- ]ones?|aio|carts?|cartridges?|disposables?|pods?|510)\b/i.test(t)) return "vapes";
  if (/\b(gumm(y|ies)|chocolates?|chews?|edibles?|mints?|drinks?|seltzers?|beverages?|tinctures?|cookies? bites?|mg\b)/i.test(t)) return "edibles";
  if (/\b(rosin|resin|badder|budder|sugar|diamonds?|sauce|wax|shatter|crumble|concentrates?|dabs?|hash)\b/i.test(t)) return "concentrate";
  if (/\b(pre[- ]?rolls?|joints?|blunts?|flower|eighths?|3\.5g|7g|14g|28g|ounces?|oz|quarters?|smalls|popcorn|shake|buds?)\b/i.test(t)) return "flower";
  return effectiveCategory(d);
}

function seenLine(d: KitDeal): string {
  const day = ctDay(d.verified_at);
  const t = ctTime(d.verified_at);
  const store = storeName(d);
  if (!day || !t) return `Seen on ${store}'s own site. Nobody pays to rank.`;
  return `Seen on ${store}'s own site ${day} at ${t}. Nobody pays to rank.`;
}

export function HeroTicket({ deal, miles, scope, label, status }: { deal: KitDeal; miles: number | null; scope: "near" | "widened" | "region"; label?: string; status?: { isOpen: boolean; label: string } | null }) {
  // Bundles and set prices ("2 for $60") have no savings figure: the ticket
  // then leads with the deal's own words instead of a number.
  const a = amountOf({ ...deal, deal_title: deal.deal_title || deal.title });
  const cat = artCategory(deal);
  const ml = milesLabel(miles);
  const isPct = a?.kind === "percent";
  const words = cleanDealTitle(deal.deal_title || deal.title) || "Deal";
  return (
    <div>
      <article className="g-ticket" aria-label={a ? `Best deal: ${a.big} off ${productOf(deal)} at ${storeName(deal)}` : `Best deal: ${words} at ${storeName(deal)}`}>
        <div className="g-ticket-top">
          <div className="g-ticket-label">
            <span>{label || (scope === "region" ? "Best everyday deal · Central IL" : scope === "widened" ? "Closest big one" : "Best everyday deal near you")}</span>
            <span>{deal.city}</span>
          </div>
          {a ? (
            <div className="g-save g-display">
              {a.upTo && <span className="g-off" style={{ display: "block", marginLeft: 0, fontSize: 20 }}>up to</span>}
              <span className="g-num">{isPct ? a.big.replace("%", "") : a.big}</span>
              <span className="g-off">{isPct ? "% off" : "off"}</span>
            </div>
          ) : (
            <div className="g-save g-display g-save-words">{words}</div>
          )}
          <div className="g-ticket-art">
            <CategoryArt category={cat} />
          </div>
          {a && <p className="g-product">{productOf(deal)}</p>}
        </div>
        <div className="g-tear" aria-hidden="true" />
        <div className="g-ticket-bot">
          <div className="g-store">
            <div>
              <Link href={storeHref(deal)} className="g-store-name">{storeName(deal)}</Link>
              <div className="g-meta">
                {status ? (
                  <span className={status.isOpen ? "g-open" : "g-closed"}>
                    <span className={`g-dot${status.isOpen ? "" : " closed"}`} />
                    {status.label}
                  </span>
                ) : (
                  <span>{deal.city}, IL</span>
                )}
                {deal.drive_thru ? <span>Drive-thru</span> : null}
              </div>
            </div>
            {ml && (
              <div className="g-miles">
                {ml.replace(" mi", "")}
                <small>{ml.startsWith("under") ? "" : "miles"}</small>
              </div>
            )}
          </div>
          <a className="g-btn" href={directionsHref(deal)} target="_blank" rel="noopener noreferrer">
            Take me there <Arrow />
          </a>
        </div>
      </article>
      <p className="g-proof">
        <Check />
        <span>{seenLine(deal)}</span>
      </p>
    </div>
  );
}

export function MiniTicket({ deal, origin }: { deal: KitDeal; origin: Origin | null }) {
  const a = amountOf(deal);
  if (!a) return null;
  const ml = milesLabel(milesTo(deal, origin));
  const isPct = a.kind === "percent";
  return (
    <Link className="g-mini" href={storeHref(deal)}>
      <div className="g-mini-top">
        <div className="g-mini-save g-display">
          {isPct ? a.big.replace("%", "") : a.big}
          <small>{isPct ? "%" : "off"}</small>
        </div>
        <CategoryArt category={artCategory(deal)} className="g-mini-art" />
      </div>
      <div className="g-mini-prod">{productOf(deal)}</div>
      <div className="g-mini-store">
        <span>{storeName(deal)}</span>
        <span>{ml || deal.city}</span>
      </div>
    </Link>
  );
}


/** Forest band that opens every page: eyebrow, big title, optional sub. */
export function Band({
  eyebrow,
  title,
  italic,
  sub,
  children,
  leaf = true,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  italic?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  leaf?: boolean;
}) {
  return (
    <section className={`g-root g-band${typeof title === "string" && title.length + String(italic || "").length > 26 ? " g-band-long" : ""}`}>
      <Grain />
      {leaf && <Leaf tone="gold" className="g-band-leaf" />}
      <div className="g-wrap g-band-in">
        {eyebrow && <div className="g-eyebrow">{eyebrow}</div>}
        <h1 className="g-display">
          {title}
          {italic && <> <span className="g-italic g-gold-text">{italic}</span></>}
        </h1>
        {sub && <p className="g-band-sub">{sub}</p>}
        {children}
      </div>
    </section>
  );
}

/** The saving as a pill: "40% off", "$10 off", or the deal's own wording. */
export function SavePill({ deal }: { deal: KitDeal }) {
  const a = amountOf({ ...deal, deal_title: deal.deal_title || deal.title });
  if (!a) {
    // Set prices ("$25 eighths", "2 for $60") show the price, not a blank "Deal".
    const v = Number(deal.discount_value);
    if (deal.discount_type === "fixed_price" && Number.isFinite(v) && v > 0) return <span className="g-pill">${Math.round(v)}</span>;
    const m = (deal.deal_title || deal.title || "").match(/\$\s?(\d{1,4})(?:\.\d{2})?\b/);
    if (m) return <span className="g-pill">${m[1]}</span>;
    return <span className="g-pill g-pill-quiet">Deal</span>;
  }
  return <span className="g-pill">{a.upTo ? "up to " : ""}{a.big} off</span>;
}

/** One compact deal line: picture, what it is, the saving. */
export function DealLine({ deal, href }: { deal: KitDeal; href?: string }) {
  const title = cleanDealTitle(deal.deal_title || deal.title) || "Deal";
  const inner = (
    <>
      <span className="g-line-art"><CategoryArt category={artCategory({ ...deal, deal_title: title })} /></span>
      <span className="g-line-text">{title}</span>
      <SavePill deal={deal} />
    </>
  );
  return href ? (
    <Link className="g-line" href={href}>{inner}</Link>
  ) : (
    <div className="g-line">{inner}</div>
  );
}

/** Deals grouped by store. Each store shows its best few; the rest fold away. */
export function StoreDeals({ deals, show = 3, cityParam }: { deals: KitDeal[]; show?: number; cityParam?: string }) {
  const groups = new Map<string, KitDeal[]>();
  for (const d of deals) {
    const k = (d.slug || d.listing_slug || "") as string;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(d);
  }
  const ordered = [...groups.entries()].sort((a, b) => {
    const best = (xs: KitDeal[]) => Math.max(...xs.map((x) => amountOf(x)?.value || 0));
    return best(b[1]) - best(a[1]) || b[1].length - a[1].length;
  });
  return (
    <div className="g-groups">
      {ordered.map(([slug, list]) => {
        const sorted = [...list].sort((a, b) => (amountOf(b)?.value || 0) - (amountOf(a)?.value || 0));
        const top = sorted.slice(0, show);
        const rest = sorted.slice(show);
        const href = `/dispensary/${slug}${cityParam ? `?city=${encodeURIComponent(cityParam)}` : ""}`;
        return (
          <div key={slug} className="g-group">
            <div className="g-group-head">
              <Link href={href} className="g-group-name">{storeName(list[0])}</Link>
              <span className="g-group-n">{list.length} deal{list.length === 1 ? "" : "s"}</span>
            </div>
            <div className="g-lines">
              {top.map((d) => (
                <DealLine key={String(d.deal_id || d.id)} deal={d} />
              ))}
            </div>
            {rest.length > 0 && (
              <details className="g-rest">
                <summary>{rest.length} more at {storeName(list[0])}</summary>
                <div className="g-lines">
                  {rest.slice(0, 10).map((d) => (
                    <DealLine key={String(d.deal_id || d.id)} deal={d} />
                  ))}
                </div>
                {rest.length > 10 && (
                  <Link href={href} className="g-rest-all">
                    All {list.length} deals at {storeName(list[0])} →
                  </Link>
                )}
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A store, the way a shopper needs it: open or not, today's hours, deals, go. */
export function StoreCard({
  slug,
  name,
  address,
  status,
  open,
  todayLabel,
  dealCount,
  chips = [],
  directions,
  phone,
  logo,
}: {
  slug: string;
  name: string;
  address?: string | null;
  status?: string | null;
  open?: boolean;
  todayLabel?: string | null;
  dealCount?: number;
  chips?: string[];
  directions?: string | null;
  phone?: string | null;
  logo?: ReactNode;
}) {
  return (
    <div className="g-store-card">
      <div className="g-sc-top">
        {logo}
        <div style={{ minWidth: 0 }}>
          <Link href={`/dispensary/${slug}`} className="g-sc-name">{name}</Link>
          {address && <div className="g-sc-addr">{address}</div>}
        </div>
        {dealCount ? <span className="g-pill">{dealCount} deal{dealCount === 1 ? "" : "s"}</span> : null}
      </div>
      <div className="g-sc-meta">
        {status && (
          <span className={open ? "g-open" : "g-closed"}>
            <span className={`g-dot${open ? "" : " closed"}`} />
            {status}
          </span>
        )}
        {todayLabel && <span>Today {todayLabel}</span>}
        {chips.map((c) => (
          <span key={c} className="g-chip">{c}</span>
        ))}
      </div>
      <div className="g-sc-actions">
        {directions && (
          <a className="g-btn g-btn-sm" href={directions} target="_blank" rel="noopener noreferrer" data-track="directions_tap" data-track-slug={slug}>
            Directions
          </a>
        )}
        <Link className="g-btn g-btn-sm g-btn-line" href={`/dispensary/${slug}`}>Store &amp; deals</Link>
        {phone && (
          <a className="g-btn g-btn-sm g-btn-line" href={`tel:${phone.replace(/[^\d+]/g, "")}`} data-track="call_tap" data-track-slug={slug}>
            Call
          </a>
        )}
      </div>
    </div>
  );
}

/** Questions as tap-to-open rows. */
export function Faq({ items, title = "Asked a lot" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <div className="g-faq">
      <h2 className="g-display">{title}</h2>
      <div className="g-faq-list">
        {items.map((e) => (
          <details key={e.q} className="g-faq-item">
            <summary>{e.q}</summary>
            <p>{e.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
